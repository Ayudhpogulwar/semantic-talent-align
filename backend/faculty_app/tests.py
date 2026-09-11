import csv
import io
import uuid
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from faculty_app.models import (
    Faculty,
    Organization,
    Opportunity,
    Certificate,
    StudentVerificationRequest,
    AuditLogEntry,
)

User = get_user_model()


class FacultyAPITestSuite(APITestCase):
    """
    Comprehensive automated integration test suite for the Faculty & Moderator module.
    Tests core verification/approval workflows, audit trail generation (KPI check),
    CSV bulk import row-level parsing/validation, and server-side RBAC permissions.
    """

    def setUp(self):
        # 1. Create User accounts
        self.super_admin_user = User.objects.create_user(
            username="super_admin", email="super@saiotaf.edu", password="password123",
            first_name="Super", last_name="Admin"
        )
        self.moderator_user = User.objects.create_user(
            username="moderator", email="mod@saiotaf.edu", password="password123",
            first_name="Sarah", last_name="Moderator"
        )
        self.student_user = User.objects.create_user(
            username="student_user", email="student@saiotaf.edu", password="password123",
            first_name="Bob", last_name="Student"
        )

        # 2. Create Faculty profiles
        self.super_admin_faculty = Faculty.objects.create(
            user=self.super_admin_user,
            employee_id="FAC001",
            department="Administration",
            role=Faculty.Role.SUPER_ADMIN,
            mfa_enabled=False
        )
        self.moderator_faculty = Faculty.objects.create(
            user=self.moderator_user,
            employee_id="FAC002",
            department="Computer Science",
            role=Faculty.Role.MODERATOR,
            mfa_enabled=False
        )

        # 3. Establish Authentication tokens
        self.super_admin_token = str(AccessToken.for_user(self.super_admin_user))
        self.moderator_token = str(AccessToken.for_user(self.moderator_user))
        self.student_token = str(AccessToken.for_user(self.student_user))

        # 4. Mock data records
        self.organization = Organization.objects.create(
            name="Alpha Corp",
            org_type=Organization.OrgType.COMPANY,
            contact_name="John Contact",
            contact_email="john@alphacorp.com",
            verification_status=Organization.VerificationStatus.PENDING
        )

        self.student_request = StudentVerificationRequest.objects.create(
            student_id=uuid.uuid4(),
            full_name="Alice Candidate",
            roll_number="CS-2026-001",
            department="Computer Science",
            year_of_study=3,
            email="alice@saiotaf.edu",
            status=StudentVerificationRequest.Status.PENDING
        )

    def set_auth_headers(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    # =========================================================================
    # 1. AUDIT LOGGING TESTS (FR-FAC-02, FR-FAC-05, FR-FAC-08)
    # =========================================================================

    def test_student_verification_writes_audit_log(self):
        """Verify that student approval action writes to AuditLogEntry."""
        self.set_auth_headers(self.moderator_token)
        url = f"/api/v1/faculty/student-verifications/{self.student_request.id}/review/"
        
        payload = {"action": "APPROVE"}
        response = self.client.post(url, payload, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(StudentVerificationRequest.objects.get(id=self.student_request.id).status, "APPROVED")

        # Check Audit Log Entry
        audit_log = AuditLogEntry.objects.filter(
            target_type=AuditLogEntry.TargetType.STUDENT_VERIFICATION,
            target_id=str(self.student_request.id)
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.action, "APPROVE")
        self.assertEqual(audit_log.actor, self.moderator_faculty)

    def test_student_flagging_requires_reason_and_writes_audit_log(self):
        """Verify flagging requires a reason, blocks on empty, and logs on success."""
        self.set_auth_headers(self.moderator_token)
        url = f"/api/v1/faculty/student-verifications/{self.student_request.id}/review/"
        
        # 1. Assert block on empty reason
        payload = {"action": "FLAG", "reason": ""}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # 2. Success with non-empty reason
        payload = {"action": "FLAG", "reason": "Doubtful roll number match"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        audit_log = AuditLogEntry.objects.filter(
            target_type=AuditLogEntry.TargetType.STUDENT_VERIFICATION,
            target_id=str(self.student_request.id),
            action="FLAG"
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.reason, "Doubtful roll number match")

    def test_organization_verification_writes_audit_log(self):
        """Verify organization verification action writes to AuditLogEntry."""
        self.set_auth_headers(self.moderator_token)
        url = f"/api/v1/faculty/organizations/{self.organization.id}/verify/"
        
        payload = {"action": "VERIFY", "notes": "Vetted via government registry check"}
        response = self.client.post(url, payload, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Organization.objects.get(id=self.organization.id).verification_status, "VERIFIED")

        audit_log = AuditLogEntry.objects.filter(
            target_type=AuditLogEntry.TargetType.ORGANIZATION,
            target_id=str(self.organization.id)
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.action, "VERIFY")
        self.assertEqual(audit_log.reason, "Vetted via government registry check")

    def test_approve_opportunity_blocked_for_unverified_organization(self):
        """Verify that opportunity approval is blocked for unverified organizations."""
        self.set_auth_headers(self.moderator_token)
        
        # 1. Create opportunity for a PENDING organization
        opportunity = Opportunity.objects.create(
            organization=self.organization, # pending
            title="Pending Org Opportunity",
            opportunity_type=Opportunity.OpportunityType.INTERNSHIP,
            description="Software Engineering role looking for python developers.",
            required_skills=["Python"],
            work_mode=Opportunity.WorkMode.REMOTE,
            application_deadline=timezone.now() + timedelta(days=10),
            positions_available=1,
            status=Opportunity.Status.PENDING_APPROVAL
        )
        
        url = f"/api/v1/faculty/opportunities/{opportunity.id}/approval/"
        payload = {"action": "APPROVE"}
        response = self.client.post(url, payload, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot approve opportunities on behalf of an unverified organization.", response.data["detail"])

    # =========================================================================
    # 2. BULK CSV IMPORT TESTS (FR-FAC-03)
    # =========================================================================

    def test_bulk_csv_import_partial_success(self):
        """
        Verify bulk CSV import processes rows, reporting errors for invalid
        rows with row numbers while committing valid ones (partial success).
        """
        self.set_auth_headers(self.moderator_token)
        url = "/api/v1/faculty/opportunities/bulk-import/"
        
        # Make organization verified, so opportunities can be created/posted
        self.organization.verification_status = Organization.VerificationStatus.VERIFIED
        self.organization.save()

        # CSV Structure with 3 valid records, 2 malformed records
        # Headers: organization_id, title, opportunity_type, description, required_skills, compensation_amount, is_unpaid, work_mode, location, duration_weeks, application_deadline, positions_available
        csv_content = (
            "organization_id,title,opportunity_type,description,required_skills,compensation_amount,is_unpaid,work_mode,location,duration_weeks,application_deadline,positions_available\n"
            f"{self.organization.id},Valid Software Intern,INTERNSHIP,Looking for Python developers to build RESTful APIs.,Python|Django|REST,30000.00,false,REMOTE,Remote,12,2026-12-31T23:59:00,2\n" # Row 2 (Valid)
            f"{self.organization.id},Invalid Deadline Intern,INTERNSHIP,Looking for junior react developers.,React,20000.00,false,HYBRID,Bangalore,8,2020-01-01T00:00:00,1\n" # Row 3 (Invalid: deadline in past)
            f"{self.organization.id},Valid Volunteer Posting,NGO,Help coordinate social work drives.,Social Work,0,true,ONSITE,Kochi,4,2026-09-30T18:00:00,5\n" # Row 4 (Valid)
            f"invalid-org-uuid,Invalid Org Intern,INTERNSHIP,Valid description text that is long enough.,Python,15000.00,false,REMOTE,,10,2026-11-30T23:59:00,1\n" # Row 5 (Invalid: bad org FK)
            f"{self.organization.id},Valid Data Engineer,INTERNSHIP,Build big data ETL pipelines in cloud environments.,SQL|Spark,40000.00,false,REMOTE,Remote,16,2026-10-15T00:00:00,3\n" # Row 6 (Valid)
        )

        csv_file = io.BytesIO(csv_content.encode("utf-8"))
        csv_file.name = "opportunities.csv"

        response = self.client.post(url, {"file": csv_file}, format="multipart")

        # HTTP Status should be 207 Multi-Status due to partial failure
        self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)
        self.assertEqual(response.data["created_count"], 3)
        self.assertEqual(len(response.data["errors"]), 2)

        # Check error lines
        rows_with_errors = [err["row"] for err in response.data["errors"]]
        self.assertIn(3, rows_with_errors) # Row 3 error due to deadline in past
        self.assertIn(5, rows_with_errors) # Row 5 error due to organization not found / invalid FK

        # Verify exact number of opportunities created (3)
        created_opps = Opportunity.objects.filter(status=Opportunity.Status.PENDING_APPROVAL)
        self.assertEqual(created_opps.count(), 3)
        self.assertTrue(created_opps.filter(title="Valid Software Intern").exists())

    # =========================================================================
    # 3. AUTHENTICATION & RBAC PERMISSION TESTS (FR-FAC-01)
    # =========================================================================

    def test_non_faculty_access_blocked(self):
        """Verify that authenticated students/non-faculty users receive 403 on endpoints."""
        self.set_auth_headers(self.student_token)
        url = "/api/v1/faculty/student-verifications/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_suspend_action_requires_department_admin_or_super_admin(self):
        """Verify that moderator role is blocked from suspending organizations."""
        url = f"/api/v1/faculty/organizations/{self.organization.id}/verify/"
        payload = {"action": "SUSPEND", "notes": "Flagrant terms violation"}

        # 1. Try with Moderator profile (FAC002) -> expected 403 Forbidden
        self.set_auth_headers(self.moderator_token)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Try with Super Admin profile (FAC001) -> expected 200 OK
        self.set_auth_headers(self.super_admin_token)
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Organization.objects.get(id=self.organization.id).verification_status, "SUSPENDED")
