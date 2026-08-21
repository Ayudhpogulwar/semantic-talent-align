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
    User.objects.all().delete()
    Faculty.objects.all().delete()
    Organization.objects.all().delete()
    Opportunity.objects.all().delete()
    StudentVerificationRequest.objects.all().delete()
    Certificate.objects.all().delete()

    # 1. Create Faculty Users
    u1 = User.objects.create_user(username="fac_mod", email="mod@saiotaf.edu", password="password123", first_name="Sarah", last_name="Connor")
    f1 = Faculty.objects.create(
        user=u1,
        employee_id="FAC101",
        department="Computer Science",
        role=Faculty.Role.MODERATOR,
        mfa_enabled=False
    )

    u2 = User.objects.create_user(username="fac_mfa", email="admin@saiotaf.edu", password="password123", first_name="John", last_name="Doe")
    f2 = Faculty.objects.create(
        user=u2,
        employee_id="FAC102",
        department="Information Technology",
        role=Faculty.Role.DEPARTMENT_ADMIN,
        mfa_enabled=True,
        mfa_secret="JBSWY3DPEHPK3PXP"
    )

    u3 = User.objects.create_user(username="fac_po", email="po@saiotaf.edu", password="password123", first_name="Robert", last_name="Miller")
    f3 = Faculty.objects.create(
        user=u3,
        employee_id="FAC103",
        department="Training & Placement",
        role=Faculty.Role.PLACEMENT_OFFICER,
        mfa_enabled=False
    )

    u4 = User.objects.create_user(username="fac_ece", email="ece_head@saiotaf.edu", password="password123", first_name="Elena", last_name="Rostova")
    f4 = Faculty.objects.create(
        user=u4,
        employee_id="FAC104",
        department="Electronics & Communication",
        role=Faculty.Role.DEPARTMENT_ADMIN,
        mfa_enabled=False
    )
    print("Created 4 Faculty accounts.")

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
    students_data = [
        ("Alice Smith", "CS-2023-042", "Computer Science", 3, "alice@saiotaf.edu", StudentVerificationRequest.Status.PENDING, None),
        ("Bob Jones", "IT-2024-118", "Information Technology", 2, "bob@saiotaf.edu", StudentVerificationRequest.Status.PENDING, None),
        ("Charlie Brown", "ME-2022-005", "Mechanical Engineering", 4, "charlie@saiotaf.edu", StudentVerificationRequest.Status.APPROVED, f1),
        ("Diana Prince", "CS-2023-088", "Computer Science", 3, "diana@saiotaf.edu", StudentVerificationRequest.Status.PENDING, None),
        ("Ethan Hunt", "ECE-2024-012", "Electronics & Communication", 2, "ethan@saiotaf.edu", StudentVerificationRequest.Status.PENDING, None),
        ("Fiona Gallagher", "IT-2023-055", "Information Technology", 3, "fiona@saiotaf.edu", StudentVerificationRequest.Status.APPROVED, f2),
        ("George Clark", "EE-2022-099", "Electrical Engineering", 4, "george@saiotaf.edu", StudentVerificationRequest.Status.FLAGGED, f3),
        ("Hannah Abbott", "CS-2024-101", "Computer Science", 1, "hannah@saiotaf.edu", StudentVerificationRequest.Status.PENDING, None),
    ]

    student_uuids = []
    for name, roll, dept, yr, email, st, reviewer in students_data:
        uid = uuid.uuid4()
        student_uuids.append(uid)
        StudentVerificationRequest.objects.create(
            student_id=uid,
            full_name=name,
            roll_number=roll,
            department=dept,
            year_of_study=yr,
            email=email,
            status=st,
            reviewed_by=reviewer,
            reviewed_at=timezone.now() - timedelta(days=1) if reviewer else None
        )
    print(f"Created {len(students_data)} student verification requests.")

    s3_uuid = student_uuids[2]

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
