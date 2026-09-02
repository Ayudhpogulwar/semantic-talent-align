"""
SAIOTAF - Faculty & Moderator Module
DRF Serializers

Validation lives here, not in views, per DRF best practice -- keeps views
thin and serializers independently unit-testable.
"""

from django.utils import timezone
from rest_framework import serializers

from .models import (
    Faculty,
    Organization,
    Opportunity,
    Certificate,
    StudentVerificationRequest,
    AuditLogEntry,
)


class FacultySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Faculty
        fields = [
            "id", "employee_id", "department", "role",
            "mfa_enabled", "is_active", "full_name", "email",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class OrganizationSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source="verified_by.user.get_full_name", read_only=True)

    class Meta:
        model = Organization
        fields = [
            "id", "name", "org_type", "website", "contact_name", "contact_email",
            "contact_phone", "verification_status", "verified_by", "verified_by_name",
            "verified_at", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "verified_by", "verified_at", "created_at", "updated_at"]

    def validate_contact_email(self, value):
        if Organization.objects.filter(contact_email__iexact=value).exclude(
            pk=getattr(self.instance, "pk", None)
        ).exists():
            raise serializers.ValidationError("An organization with this contact email already exists.")
        return value


class OrganizationVerificationActionSerializer(serializers.Serializer):
    """Payload for approve/reject/suspend actions on an Organization."""
    action = serializers.ChoiceField(choices=["VERIFY", "REJECT", "SUSPEND"])
    notes = serializers.CharField(required=False, allow_blank=True)


class OpportunitySerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            "id", "organization", "organization_name", "title", "opportunity_type",
            "description", "required_skills", "compensation_amount", "compensation_currency",
            "is_unpaid", "work_mode", "location", "duration_weeks", "application_deadline",
            "positions_available", "status", "posted_by", "approved_by", "approved_at",
            "rejection_reason", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "posted_by", "approved_by", "approved_at",
            "rejection_reason", "created_at", "updated_at",
        ]

    def validate_required_skills(self, value):
        if not isinstance(value, list) or not all(isinstance(s, str) for s in value):
            raise serializers.ValidationError("required_skills must be a list of strings.")
        if len(value) == 0:
            raise serializers.ValidationError("At least one required skill must be specified.")
        return [s.strip() for s in value if s.strip()]

    def validate_application_deadline(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Application deadline must be in the future.")
        return value

    def validate(self, attrs):
        is_unpaid = attrs.get("is_unpaid", getattr(self.instance, "is_unpaid", False))
        compensation = attrs.get("compensation_amount", getattr(self.instance, "compensation_amount", None))
        if not is_unpaid and compensation is None:
            raise serializers.ValidationError(
                {"compensation_amount": "Required unless the opportunity is marked unpaid."}
            )
        return attrs


class OpportunityApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] == "REJECT" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError(
                {"rejection_reason": "Required when rejecting an opportunity."}
            )
        return attrs


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = [
            "id", "student_id", "opportunity", "organization", "file_url",
            "issue_date", "verification_status", "verified_by", "verified_at",
            "rejection_reason", "created_at",
        ]
        read_only_fields = ["id", "verification_status", "verified_by", "verified_at", "created_at"]


class CertificateVerificationActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["VERIFY", "REJECT"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] == "REJECT" and not attrs.get("rejection_reason"):
            raise serializers.ValidationError(
                {"rejection_reason": "Required when rejecting a certificate."}
            )
        return attrs


class StudentVerificationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentVerificationRequest
        fields = [
            "id", "student_id", "full_name", "roll_number", "department",
            "year_of_study", "email", "status", "reviewed_by", "reviewed_at",
            "flag_reason", "created_at",
        ]
        read_only_fields = ["id", "status", "reviewed_by", "reviewed_at", "created_at"]


class StudentVerificationActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["APPROVE", "REJECT", "FLAG"])
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["action"] in ("REJECT", "FLAG") and not attrs.get("reason"):
            raise serializers.ValidationError({"reason": f"Required when action is {attrs['action']}."})
        return attrs


class AuditLogEntrySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.user.get_full_name", read_only=True)

    class Meta:
        model = AuditLogEntry
        fields = [
            "id", "actor", "actor_name", "target_type", "target_id",
            "action", "reason", "metadata", "created_at",
        ]
        read_only_fields = fields


class BulkOpportunityCSVUploadSerializer(serializers.Serializer):
    """Validates the incoming multipart file for bulk CSV opportunity import."""
    file = serializers.FileField()

    def validate_file(self, value):
        if not value.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Only .csv files are supported.")
        max_size_mb = 5
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(f"File exceeds {max_size_mb}MB limit.")
        return value
