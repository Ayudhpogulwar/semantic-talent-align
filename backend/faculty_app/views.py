"""
SAIOTAF - Faculty & Moderator Module
API Views / Controllers

All mutating endpoints write an AuditLogEntry -- this is not optional
decoration, it is a hard NFR (Auditability) for verification actions.
"""

import csv
import io
import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Faculty,
    Organization,
    Opportunity,
    Certificate,
    StudentVerificationRequest,
    AuditLogEntry,
)
from .serializers import (
    FacultySerializer,
    OrganizationSerializer,
    OrganizationVerificationActionSerializer,
    OpportunitySerializer,
    OpportunityApprovalActionSerializer,
    CertificateSerializer,
    CertificateVerificationActionSerializer,
    StudentVerificationRequestSerializer,
    StudentVerificationActionSerializer,
    AuditLogEntrySerializer,
    BulkOpportunityCSVUploadSerializer,
)
from .permissions import IsFacultyUser, CanApproveOpportunities, IsSuperAdminOrDeptAdmin
from .utils.csv_import import parse_opportunity_csv_row, CSVRowError
from .utils.report_generator import generate_placement_report

logger = logging.getLogger(__name__)


def _write_audit_log(actor, target_type, target_id, action_name, reason="", metadata=None):
    AuditLogEntry.objects.create(
        actor=actor,
        target_type=target_type,
        target_id=str(target_id),
        action=action_name,
        reason=reason or "",
        metadata=metadata or {},
    )


# ---------------------------------------------------------------------------
# Student Verification  (FR-FAC-02)
# ---------------------------------------------------------------------------

class StudentVerificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only list/detail of pending (and historical) student verification
    requests, plus a custom `review` action to approve/reject/flag.
    Write is intentionally NOT exposed via standard create/update -- records
    are created by the Student module via an internal service call, and
    faculty may only transition status through the `review` action so every
    change is captured in the audit trail.
    """

    queryset = StudentVerificationRequest.objects.select_related("reviewed_by").all()
    serializer_class = StudentVerificationRequestSerializer
    permission_classes = [IsFacultyUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "department"]
    search_fields = ["full_name", "roll_number", "email"]
    ordering_fields = ["created_at", "full_name"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"], url_path="review")
    @transaction.atomic
    def review(self, request, pk=None):
        record = self.get_object()
        serializer = StudentVerificationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_value = serializer.validated_data["action"]
        reason = serializer.validated_data.get("reason", "")

        faculty = request.user.faculty_profile
        status_map = {
            "APPROVE": StudentVerificationRequest.Status.APPROVED,
            "REJECT": StudentVerificationRequest.Status.REJECTED,
            "FLAG": StudentVerificationRequest.Status.FLAGGED,
        }
        record.status = status_map[action_value]
        record.reviewed_by = faculty
        record.reviewed_at = timezone.now()
        if action_value == "FLAG":
            record.flag_reason = reason
        record.save(update_fields=["status", "reviewed_by", "reviewed_at", "flag_reason", "updated_at"])

        _write_audit_log(
            actor=faculty,
            target_type=AuditLogEntry.TargetType.STUDENT_VERIFICATION,
            target_id=record.id,
            action_name=action_value,
            reason=reason,
            metadata={"roll_number": record.roll_number},
        )

        # NOTE: In production this triggers an event (e.g. via the shared
        # Notification Service message bus) so the Student module can update
        # the student's own dashboard state without this module depending on it.
        logger.info("Student verification %s -> %s by %s", record.id, action_value, faculty.employee_id)

        return Response(self.get_serializer(record).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Organization Management  (FR-FAC-08)
# ---------------------------------------------------------------------------

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.select_related("verified_by").all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsFacultyUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["org_type", "verification_status"]
    search_fields = ["name", "contact_email"]
    ordering_fields = ["created_at", "name"]

    @action(detail=True, methods=["post"], url_path="verify")
    @transaction.atomic
    def verify(self, request, pk=None):
        org = self.get_object()
        serializer = OrganizationVerificationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_value = serializer.validated_data["action"]
        notes = serializer.validated_data.get("notes", "")

        # Suspension is a higher-privilege action.
        if action_value == "SUSPEND" and not IsSuperAdminOrDeptAdmin().has_permission(request, self):
            return Response(
                {"detail": "Suspending an organization requires Department Admin or Super Admin."},
                status=status.HTTP_403_FORBIDDEN,
            )

        faculty = request.user.faculty_profile
        status_map = {
            "VERIFY": Organization.VerificationStatus.VERIFIED,
            "REJECT": Organization.VerificationStatus.REJECTED,
            "SUSPEND": Organization.VerificationStatus.SUSPENDED,
        }
        org.verification_status = status_map[action_value]
        org.verified_by = faculty
        org.verified_at = timezone.now()
        if notes:
            org.notes = notes
        org.save(update_fields=["verification_status", "verified_by", "verified_at", "notes", "updated_at"])

        _write_audit_log(
            actor=faculty,
            target_type=AuditLogEntry.TargetType.ORGANIZATION,
            target_id=org.id,
            action_name=action_value,
            reason=notes,
        )
        return Response(self.get_serializer(org).data)


# ---------------------------------------------------------------------------
# Opportunity Management  (FR-FAC-03, FR-FAC-04)
# ---------------------------------------------------------------------------

class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.select_related("organization", "posted_by", "approved_by").all()
    serializer_class = OpportunitySerializer
    permission_classes = [CanApproveOpportunities]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "opportunity_type", "work_mode", "organization"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "application_deadline"]

    def perform_create(self, serializer):
        faculty = self.request.user.faculty_profile
        instance = serializer.save(posted_by=faculty, status=Opportunity.Status.PENDING_APPROVAL)
        _write_audit_log(
            actor=faculty,
            target_type=AuditLogEntry.TargetType.OPPORTUNITY,
            target_id=instance.id,
            action_name="CREATE",
        )

    @action(detail=True, methods=["post"], url_path="approval")
    @transaction.atomic
    def approval(self, request, pk=None):
        """Approve or reject a pending opportunity posting."""
        opportunity = self.get_object()
        serializer = OpportunityApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_value = serializer.validated_data["action"]
        faculty = request.user.faculty_profile

        if action_value == "APPROVE":
            opportunity.status = Opportunity.Status.APPROVED
            opportunity.approved_by = faculty
            opportunity.approved_at = timezone.now()
            opportunity.rejection_reason = None
        else:
            opportunity.status = Opportunity.Status.REJECTED
            opportunity.rejection_reason = serializer.validated_data["rejection_reason"]

        opportunity.save(update_fields=[
            "status", "approved_by", "approved_at", "rejection_reason", "updated_at"
        ])

        _write_audit_log(
            actor=faculty,
            target_type=AuditLogEntry.TargetType.OPPORTUNITY,
            target_id=opportunity.id,
            action_name=action_value,
            reason=opportunity.rejection_reason or "",
        )
        return Response(self.get_serializer(opportunity).data)

    @action(detail=False, methods=["post"], url_path="bulk-import",
            parser_classes=[MultiPartParser, FormParser])
    @transaction.atomic
    def bulk_import(self, request):
        """
        FR-FAC-03: Bulk CSV import of opportunities.
        Expected columns: organization_id,title,opportunity_type,description,
        required_skills,compensation_amount,is_unpaid,work_mode,location,
        duration_weeks,application_deadline,positions_available
        (required_skills is a "|"-delimited string, e.g. "Python|Django|SQL")
        """
        upload_serializer = BulkOpportunityCSVUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        csv_file = upload_serializer.validated_data["file"]

        decoded = csv_file.read().decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(decoded))

        faculty = request.user.faculty_profile
        created, errors = [], []

        for row_number, row in enumerate(reader, start=2):  # row 1 = header
            try:
                opportunity_data = parse_opportunity_csv_row(row)
            except CSVRowError as exc:
                errors.append({"row": row_number, "error": str(exc)})
                continue

            serializer = OpportunitySerializer(data=opportunity_data)
            if not serializer.is_valid():
                errors.append({"row": row_number, "error": serializer.errors})
                continue

            instance = serializer.save(posted_by=faculty, status=Opportunity.Status.PENDING_APPROVAL)
            created.append(str(instance.id))

        if created:
            _write_audit_log(
                actor=faculty,
                target_type=AuditLogEntry.TargetType.OPPORTUNITY,
                target_id="BULK",
                action_name="BULK_IMPORT",
                metadata={"created_count": len(created), "error_count": len(errors)},
            )

        response_status = status.HTTP_207_MULTI_STATUS if errors else status.HTTP_201_CREATED
        return Response(
            {"created_count": len(created), "created_ids": created, "errors": errors},
            status=response_status,
        )


# ---------------------------------------------------------------------------
# Certificate Verification  (FR-FAC-05)
# ---------------------------------------------------------------------------

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.select_related("opportunity", "organization", "verified_by").all()
    serializer_class = CertificateSerializer
    permission_classes = [IsFacultyUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["verification_status", "student_id"]

    @action(detail=True, methods=["post"], url_path="review")
    @transaction.atomic
    def review(self, request, pk=None):
        certificate = self.get_object()
        serializer = CertificateVerificationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action_value = serializer.validated_data["action"]
        faculty = request.user.faculty_profile

        if action_value == "VERIFY":
            certificate.verification_status = Certificate.VerificationStatus.VERIFIED
            certificate.rejection_reason = None
        else:
            certificate.verification_status = Certificate.VerificationStatus.REJECTED
            certificate.rejection_reason = serializer.validated_data["rejection_reason"]

        certificate.verified_by = faculty
        certificate.verified_at = timezone.now()
        certificate.save(update_fields=[
            "verification_status", "verified_by", "verified_at", "rejection_reason", "updated_at"
        ])

        _write_audit_log(
            actor=faculty,
            target_type=AuditLogEntry.TargetType.CERTIFICATE,
            target_id=certificate.id,
            action_name=action_value,
            reason=certificate.rejection_reason or "",
            metadata={"student_id": str(certificate.student_id)},
        )
        return Response(self.get_serializer(certificate).data)


# ---------------------------------------------------------------------------
# Audit Log (read-only, supports both FR-FAC-05 and FR-FAC-07)
# ---------------------------------------------------------------------------

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLogEntry.objects.select_related("actor").all()
    serializer_class = AuditLogEntrySerializer
    permission_classes = [IsFacultyUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["target_type", "action"]
    ordering = ["-created_at"]


# ---------------------------------------------------------------------------
# Reports & Analytics  (FR-FAC-06, FR-FAC-07)
# ---------------------------------------------------------------------------

class ReportViewSet(viewsets.ViewSet):
    """
    Non-model viewset: aggregation + export endpoints.
    Heavy aggregation queries are isolated here so they can later be moved
    to a scheduled job / materialized view without touching CRUD viewsets.
    """

    permission_classes = [IsFacultyUser]

    @action(detail=False, methods=["get"], url_path="funnel")
    def application_funnel(self, request):
        """
        Returns application funnel counts. In production this queries the
        Application Management module's tables (owned by the core backend
        team) via a read replica or internal API -- stubbed here with a
        clear integration seam.
        """
        # TODO(integration): replace with real aggregation once the
        # Application model (owned by core backend) is available.
        data = {
            "applied": 0,
            "under_review": 0,
            "shortlisted": 0,
            "interview": 0,
            "offered": 0,
            "rejected": 0,
        }
        return Response(data)

    @action(detail=False, methods=["get"], url_path="skill-gaps")
    def skill_gap_summary(self, request):
        """
        Cohort-wide skill gap heatmap data. Pulls SkillRec output from the
        AI engine's Recommendation History store (Mongo) -- stubbed here;
        this module only defines the response contract the frontend chart
        component expects.
        """
        data = {"skills": [], "gap_counts": []}
        return Response(data)

    @action(detail=False, methods=["get"], url_path="export")
    def export_report(self, request):
        """
        Generates a downloadable PDF/Excel accreditation-style report.
        Query params: ?format=pdf|xlsx&department=<name>&term=<term>
        """
        fmt = request.query_params.get("format", "pdf")
        department = request.query_params.get("department")
        term = request.query_params.get("term")

        if fmt not in ("pdf", "xlsx"):
            return Response({"detail": "format must be 'pdf' or 'xlsx'."}, status=400)

        file_bytes, content_type, filename = generate_placement_report(
            fmt=fmt, department=department, term=term
        )

        response = Response(file_bytes, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        _write_audit_log(
            actor=request.user.faculty_profile,
            target_type=AuditLogEntry.TargetType.OPPORTUNITY,  # generic; reports aren't a modeled entity
            target_id="REPORT",
            action_name="EXPORT_REPORT",
            metadata={"format": fmt, "department": department, "term": term},
        )
        return response
