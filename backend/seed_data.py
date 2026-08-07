import os
import django
import uuid
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth.models import User
from faculty_app.models import Faculty, Organization, Opportunity, StudentVerificationRequest, Certificate

def seed():
    print("Seeding database...")
    # Delete existing data to start fresh
    User.objects.exclude(is_superuser=True).delete()
    Faculty.objects.all().delete()
    Organization.objects.all().delete()
    Opportunity.objects.all().delete()
    StudentVerificationRequest.objects.all().delete()
    Certificate.objects.all().delete()

    # 1. Create Faculty Users
    # Faculty with MFA Disabled
    u1 = User.objects.create_user(username="fac_mod", email="mod@saiotaf.edu", password="password123", first_name="Sarah", last_name="Connor")
    f1 = Faculty.objects.create(
        user=u1,
        employee_id="FAC101",
        department="Computer Science",
        role=Faculty.Role.MODERATOR,
        mfa_enabled=False
    )
    print("Created Faculty mod: FAC101 (MFA Disabled)")

    # Faculty with MFA Enabled
    u2 = User.objects.create_user(username="fac_mfa", email="admin@saiotaf.edu", password="password123", first_name="John", last_name="Doe")
    f2 = Faculty.objects.create(
        user=u2,
        employee_id="FAC102",
        department="Information Technology",
        role=Faculty.Role.DEPARTMENT_ADMIN,
        mfa_enabled=True,
        mfa_secret="JBSWY3DPEHPK3PXP" # dummy base32 secret
    )
    print("Created Faculty admin: FAC102 (MFA Enabled)")

    # 2. Create Organizations
    org1 = Organization.objects.create(
        name="Acme Corporation",
        org_type=Organization.OrgType.COMPANY,
        website="https://acme.example.com",
        contact_name="Wiley Coyote",
        contact_email="wiley@acme.example.com",
        contact_phone="+15550199",
        verification_status=Organization.VerificationStatus.VERIFIED,
        verified_by=f1,
        verified_at=timezone.now() - timedelta(days=10),
        notes="High-tech engineering partner."
    )

    org2 = Organization.objects.create(
        name="Global Hope Foundation",
        org_type=Organization.OrgType.NGO,
        website="https://globalhope.example.org",
        contact_name="Jane Goodall",
        contact_email="jane@globalhope.example.org",
        verification_status=Organization.VerificationStatus.PENDING,
        notes="Non-profit focused on ecology."
    )

    org3 = Organization.objects.create(
        name="Stark Industries",
        org_type=Organization.OrgType.COMPANY,
        website="https://stark.example.com",
        contact_name="Pepper Potts",
        contact_email="pepper@stark.example.com",
        verification_status=Organization.VerificationStatus.VERIFIED,
        verified_by=f2,
        verified_at=timezone.now() - timedelta(days=5),
        notes="Defense and clean energy titan."
    )
    print("Created 3 organizations.")

    # 3. Create Opportunities
    opp1 = Opportunity.objects.create(
        organization=org1,
        title="Frontend Engineering Intern",
        opportunity_type=Opportunity.OpportunityType.INTERNSHIP,
        description="Join our frontend UI/UX team. You will build highly responsive web pages using React and Bootstrap.",
        required_skills=["React", "JavaScript", "HTML/CSS", "Bootstrap"],
        compensation_amount=25000.00,
        compensation_currency="INR",
        is_unpaid=False,
        work_mode=Opportunity.WorkMode.HYBRID,
        location="Bangalore, KA",
        duration_weeks=12,
        application_deadline=timezone.now() + timedelta(days=30),
        positions_available=3,
        status=Opportunity.Status.APPROVED,
        posted_by=f1,
        approved_by=f1,
        approved_at=timezone.now() - timedelta(days=9)
    )

    opp2 = Opportunity.objects.create(
        organization=org2,
        title="Rural Development Volunteer",
        opportunity_type=Opportunity.OpportunityType.NGO,
        description="Help coordinate literacy campaigns and community outreach in rural learning hubs.",
        required_skills=["Public Speaking", "Social Work", "Local Language"],
        is_unpaid=True,
        work_mode=Opportunity.WorkMode.ONSITE,
        location="Wayanad, KL",
        duration_weeks=8,
        application_deadline=timezone.now() + timedelta(days=15),
        positions_available=5,
        status=Opportunity.Status.PENDING_APPROVAL,
        posted_by=f2
    )

    opp3 = Opportunity.objects.create(
        organization=org3,
        title="AI Research Assistant",
        opportunity_type=Opportunity.OpportunityType.INTERNSHIP,
        description="Assist in training machine learning models for computer vision and autonomous robotics.",
        required_skills=["Python", "PyTorch", "Linear Algebra", "Machine Learning"],
        compensation_amount=50000.00,
        compensation_currency="INR",
        is_unpaid=False,
        work_mode=Opportunity.WorkMode.REMOTE,
        duration_weeks=24,
        application_deadline=timezone.now() + timedelta(days=45),
        positions_available=2,
        status=Opportunity.Status.APPROVED,
        posted_by=f2,
        approved_by=f2,
        approved_at=timezone.now() - timedelta(days=4)
    )
    print("Created 3 opportunities.")

    # 4. Create Student Verification Requests (Roll number verification queue)
    s1_uuid = uuid.uuid4()
    StudentVerificationRequest.objects.create(
        student_id=s1_uuid,
        full_name="Alice Smith",
        roll_number="CS-2023-042",
        department="Computer Science",
        year_of_study=3,
        email="alice@saiotaf.edu",
        status=StudentVerificationRequest.Status.PENDING
    )

    s2_uuid = uuid.uuid4()
    StudentVerificationRequest.objects.create(
        student_id=s2_uuid,
        full_name="Bob Jones",
        roll_number="IT-2024-118",
        department="Information Technology",
        year_of_study=2,
        email="bob@saiotaf.edu",
        status=StudentVerificationRequest.Status.PENDING
    )

    s3_uuid = uuid.uuid4()
    StudentVerificationRequest.objects.create(
        student_id=s3_uuid,
        full_name="Charlie Brown",
        roll_number="ME-2022-005",
        department="Mechanical Engineering",
        year_of_study=4,
        email="charlie@saiotaf.edu",
        status=StudentVerificationRequest.Status.APPROVED,
        reviewed_by=f1,
        reviewed_at=timezone.now() - timedelta(days=2)
    )
    print("Created 3 student verification requests.")

    # 5. Create Certificates
    Certificate.objects.create(
        student_id=s3_uuid, # Charlie Brown is already approved and has completed a program
        opportunity=opp1,
        organization=org1,
        file_url="/sample_certificate.png",
        issue_date=datetime.now().date() - timedelta(days=15),
        verification_status=Certificate.VerificationStatus.PENDING
    )

    Certificate.objects.create(
        student_id=uuid.uuid4(), # some other student's certificate
        opportunity=opp3,
        organization=org3,
        file_url="/sample_certificate.png",
        issue_date=datetime.now().date() - timedelta(days=20),
        verification_status=Certificate.VerificationStatus.VERIFIED,
        verified_by=f2,
        verified_at=timezone.now() - timedelta(days=3)
    )
    print("Created 2 certificates.")
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
