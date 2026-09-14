"""
SAIOTAF - Faculty & Moderator Module
Database Models (Django ORM -> MySQL)

Design notes for cross-team integration:
- `student_app.Student` is referenced by string reference ("student_app.Student")
  so this module has ZERO hard import dependency on the Student module's code.
  Only the DB foreign key constraint is shared, which is the correct decoupling
  boundary for two teams working in parallel.
- All models expose `created_at` / `updated_at` for auditability (NFR: Auditability).
- Status fields use Django TextChoices for type-safety and clean OpenAPI schema generation.
"""

import uuid
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class TimeStampedModel(models.Model):
    """Abstract base providing created/updated audit timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Faculty
# ---------------------------------------------------------------------------

class Faculty(TimeStampedModel):
    """
    Faculty / Moderator / Admin account.
    Extends the platform's core auth.User via a 1-1 profile link rather than
    a custom User model, so both Student and Faculty modules can share the
    same authentication backend without conflict.
    """

    class Role(models.TextChoices):
        MODERATOR = "MODERATOR", "Moderator"
        PLACEMENT_OFFICER = "PLACEMENT_OFFICER", "Placement Officer"
        DEPARTMENT_ADMIN = "DEPARTMENT_ADMIN", "Department Admin"
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="faculty_profile",
    )
    employee_id = models.CharField(max_length=32, unique=True)
    department = models.CharField(max_length=100)
    role = models.CharField(max_length=32, choices=Role.choices, default=Role.MODERATOR)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=64, blank=True, null=True)  # TOTP secret, encrypted at rest via field-level encryption in production
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "faculty"
        indexes = [models.Index(fields=["department"]), models.Index(fields=["role"])]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.role})"


# ---------------------------------------------------------------------------
# Organizations
# ---------------------------------------------------------------------------

class Organization(TimeStampedModel):
    """Partner companies and NGOs that post opportunities."""

    class OrgType(models.TextChoices):
        COMPANY = "COMPANY", "Company"
        NGO = "NGO", "NGO"

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"
        SUSPENDED = "SUSPENDED", "Suspended"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    org_type = models.CharField(max_length=16, choices=OrgType.choices)
    website = models.URLField(blank=True, null=True)
    contact_name = models.CharField(max_length=150)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    verification_status = models.CharField(
        max_length=16, choices=VerificationStatus.choices, default=VerificationStatus.PENDING
    )
    verified_by = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_organizations"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "organizations"
        indexes = [models.Index(fields=["verification_status"]), models.Index(fields=["org_type"])]

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Opportunities (Internships / NGO placements)
# ---------------------------------------------------------------------------

class Opportunity(TimeStampedModel):
    """Unified model for Internship and NGO opportunity postings."""

    class OpportunityType(models.TextChoices):
        INTERNSHIP = "INTERNSHIP", "Internship"
        NGO = "NGO", "NGO"

    class WorkMode(models.TextChoices):
        REMOTE = "REMOTE", "Remote"
        ONSITE = "ONSITE", "Onsite"
        HYBRID = "HYBRID", "Hybrid"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        CLOSED = "CLOSED", "Closed"
        EXPIRED = "EXPIRED", "Expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="opportunities"
    )
    title = models.CharField(max_length=200)
    opportunity_type = models.CharField(max_length=16, choices=OpportunityType.choices)
    description = models.TextField()

    # Required skills stored as JSON array of strings; the AI engine (owned by
    # a separate service) reads this field to compute embeddings. This module
    # does NOT compute embeddings itself -- clean separation of concerns.
    required_skills = models.JSONField(default=list, blank=True)

    compensation_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    compensation_currency = models.CharField(max_length=8, default="INR")
    is_unpaid = models.BooleanField(default=False)

    work_mode = models.CharField(max_length=16, choices=WorkMode.choices)
    location = models.CharField(max_length=200, blank=True, null=True)
    duration_weeks = models.PositiveSmallIntegerField(null=True, blank=True)

    application_deadline = models.DateTimeField()
    positions_available = models.PositiveSmallIntegerField(default=1)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_APPROVAL)

    posted_by = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, related_name="posted_opportunities"
    )
    approved_by = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_opportunities"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "opportunities"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["opportunity_type"]),
            models.Index(fields=["application_deadline"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} @ {self.organization.name}"


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------

class Certificate(TimeStampedModel):
    """
    Completion certificates uploaded by students (or organizations on a
    student's behalf) for verification by faculty.

    NOTE: `student_id` is a loosely-coupled reference (UUIDField, not FK) to
    the Student module's table. This is a DELIBERATE decoupling choice: the
    Faculty module must remain deployable/testable without the Student
    module's models being installed. Referential integrity is enforced at
    the application layer via `student_app` client calls, not at the DB layer.
    If both modules end up in the same Django project with shared migrations,
    this can be upgraded to a real ForeignKey.
    """

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.UUIDField(db_index=True)  # loose reference, see docstring
    opportunity = models.ForeignKey(
        Opportunity, on_delete=models.SET_NULL, null=True, blank=True, related_name="certificates"
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name="issued_certificates"
    )
    file_url = models.CharField(max_length=500)  # object storage URI
    issue_date = models.DateField(null=True, blank=True)

    verification_status = models.CharField(
        max_length=16, choices=VerificationStatus.choices, default=VerificationStatus.PENDING
    )
    verified_by = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="verified_certificates"
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "certificates"
        indexes = [models.Index(fields=["verification_status"]), models.Index(fields=["student_id"])]

    def __str__(self):
        return f"Certificate({self.id}) - {self.verification_status}"


# ---------------------------------------------------------------------------
# Student Verification (roll-number based eligibility check)
# ---------------------------------------------------------------------------

class StudentVerificationRequest(TimeStampedModel):
    """
    Queue of pending student registrations awaiting faculty approval.
    Mirrors minimal student identity data needed for verification so this
    module can render a review table without calling into the Student
    module's API synchronously (denormalized read model / cache pattern).
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
        FLAGGED = "FLAGGED", "Flagged"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.UUIDField(db_index=True, unique=True)  # loose reference
    full_name = models.CharField(max_length=150)
    roll_number = models.CharField(max_length=32, db_index=True)
    department = models.CharField(max_length=100)
    year_of_study = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(6)]
    )
    email = models.EmailField()

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_students"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    flag_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "student_verification_requests"
        indexes = [models.Index(fields=["status"]), models.Index(fields=["roll_number"])]

    def __str__(self):
        return f"{self.full_name} ({self.roll_number}) - {self.status}"


# ---------------------------------------------------------------------------
# Audit Log (cross-cutting, supports NFR-Auditability)
# ---------------------------------------------------------------------------

class AuditLogEntry(TimeStampedModel):
    """
    Generic audit trail for all verification / approval actions taken by
    faculty. Intentionally denormalized (stores target_type + target_id as
    strings) so any current or future model can be audited without schema
    migration churn.
    """

    class TargetType(models.TextChoices):
        STUDENT_VERIFICATION = "STUDENT_VERIFICATION", "Student Verification"
        CERTIFICATE = "CERTIFICATE", "Certificate"
        ORGANIZATION = "ORGANIZATION", "Organization"
        OPPORTUNITY = "OPPORTUNITY", "Opportunity"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, related_name="audit_entries")
    target_type = models.CharField(max_length=32, choices=TargetType.choices)
    target_id = models.CharField(max_length=64)
    action = models.CharField(max_length=64)  # e.g. "APPROVE", "REJECT", "FLAG"
    reason = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "audit_log_entries"
        indexes = [models.Index(fields=["target_type", "target_id"])]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor} {self.action} {self.target_type}:{self.target_id}"
