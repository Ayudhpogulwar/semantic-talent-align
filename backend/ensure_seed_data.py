import os
import django
import uuid
from datetime import datetime, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection, transaction
from django.utils import timezone
from django.contrib.auth.models import User

def ensure_tables():
    """Ensure Django ORM tables exist with expected schema."""
    with connection.cursor() as cursor:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        # Drop legacy tables with foreign key constraints on opportunities/organizations
        cursor.execute("DROP TABLE IF EXISTS ngo_opportunities;")
        cursor.execute("DROP TABLE IF EXISTS internships;")
        cursor.execute("DROP TABLE IF EXISTS application_status_history;")
        cursor.execute("DROP TABLE IF EXISTS applications;")
        cursor.execute("DROP TABLE IF EXISTS audit_log_entries;")
        cursor.execute("DROP TABLE IF EXISTS certificates;")
        cursor.execute("DROP TABLE IF EXISTS opportunities;")
        cursor.execute("DROP TABLE IF EXISTS organizations;")
        cursor.execute("DROP TABLE IF EXISTS faculty;")
        cursor.execute("DROP TABLE IF EXISTS student_verification_requests;")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS faculty (
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            employee_id VARCHAR(32) NOT NULL UNIQUE,
            department VARCHAR(100) NOT NULL,
            role VARCHAR(32) NOT NULL DEFAULT 'MODERATOR',
            mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
            mfa_secret VARCHAR(64) NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            user_id INT NOT NULL UNIQUE
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_verification_requests (
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            student_id VARCHAR(36) NOT NULL UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            roll_number VARCHAR(32) NOT NULL,
            department VARCHAR(100) NOT NULL,
            year_of_study SMALLINT UNSIGNED NOT NULL,
            email VARCHAR(254) NOT NULL,
            status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
            reviewed_at DATETIME(6) NULL,
            flag_reason LONGTEXT NULL,
            reviewed_by_id VARCHAR(36) NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            org_type VARCHAR(16) NOT NULL,
            website VARCHAR(200) NULL,
            contact_name VARCHAR(150) NOT NULL,
            contact_email VARCHAR(254) NOT NULL,
            contact_phone VARCHAR(20) NULL,
            verification_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
            verified_at DATETIME(6) NULL,
            notes LONGTEXT NULL,
            verified_by_id VARCHAR(36) NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS opportunities (
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            opportunity_type VARCHAR(16) NOT NULL,
            description LONGTEXT NOT NULL,
            required_skills JSON NULL,
            compensation_amount DECIMAL(10, 2) NULL,
            compensation_currency VARCHAR(8) NOT NULL DEFAULT 'INR',
            is_unpaid TINYINT(1) NOT NULL DEFAULT 0,
            work_mode VARCHAR(16) NOT NULL,
            location VARCHAR(200) NULL,
            duration_weeks SMALLINT UNSIGNED NULL,
            application_deadline DATETIME(6) NOT NULL,
            positions_available SMALLINT UNSIGNED NOT NULL DEFAULT 1,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL',
            approved_at DATETIME(6) NULL,
            rejection_reason LONGTEXT NULL,
            approved_by_id VARCHAR(36) NULL,
            organization_id VARCHAR(36) NOT NULL,
            posted_by_id VARCHAR(36) NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS certificates (
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            student_id VARCHAR(36) NOT NULL,
            file_url VARCHAR(500) NOT NULL,
            issue_date DATE NULL,
            verification_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
            verified_at DATETIME(6) NULL,
            rejection_reason LONGTEXT NULL,
            opportunity_id VARCHAR(36) NULL,
            organization_id VARCHAR(36) NULL,
            verified_by_id VARCHAR(36) NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_log_entries (
            created_at DATETIME(6) NOT NULL,
            updated_at DATETIME(6) NOT NULL,
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            target_type VARCHAR(32) NOT NULL,
            target_id VARCHAR(64) NOT NULL,
            action VARCHAR(64) NOT NULL,
            reason LONGTEXT NULL,
            metadata JSON NULL,
            actor_id VARCHAR(36) NULL
        );
        """)

        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

def seed():
    ensure_tables()

    from faculty_app.models import (
        Faculty,
        Organization,
        Opportunity,
        StudentVerificationRequest,
        Certificate
    )

    print("Seeding dynamic data...")

    # 1. Create Default Faculty User if not exists
    user, created = User.objects.get_or_create(
        username="yogi_sir",
        defaults={
            "email": "yogi@saiotaf.edu",
            "first_name": "Yogi",
            "last_name": "Sir",
            "is_staff": True,
            "is_superuser": True
        }
    )
    if created or not user.check_password("password123"):
        user.set_password("password123")
        user.save()

    faculty_profile, _ = Faculty.objects.get_or_create(
        user=user,
        defaults={
            "employee_id": "FAC-999",
            "department": "Computer Science & Engineering",
            "role": Faculty.Role.PLACEMENT_OFFICER,
            "is_active": True
        }
    )

    # 2. Seed Student Verification Requests
    verifications_data = [
        {
            "full_name": "Aarav Sharma",
            "roll_number": "CS2023001",
            "department": "Computer Science",
            "year_of_study": 3,
            "email": "aarav.sharma@student.edu",
            "status": "PENDING"
        },
        {
            "full_name": "Priya Ananya Patel",
            "roll_number": "IT2023045",
            "department": "Information Technology",
            "year_of_study": 4,
            "email": "priya.patel@student.edu",
            "status": "PENDING"
        },
        {
            "full_name": "Rohan Deshmukh",
            "roll_number": "AI2024012",
            "department": "Artificial Intelligence & ML",
            "year_of_study": 2,
            "email": "rohan.d@student.edu",
            "status": "APPROVED"
        },
        {
            "full_name": "Neha Kulkarni",
            "roll_number": "EC2023089",
            "department": "Electronics & Communication",
            "year_of_study": 3,
            "email": "neha.k@student.edu",
            "status": "PENDING"
        },
        {
            "full_name": "Vikramaditya Singh",
            "roll_number": "CS2022019",
            "department": "Computer Science",
            "year_of_study": 4,
            "email": "vikram.singh@student.edu",
            "status": "APPROVED"
        },
        {
            "full_name": "Ananya Roy",
            "roll_number": "DS2024005",
            "department": "Data Science",
            "year_of_study": 2,
            "email": "ananya.roy@student.edu",
            "status": "FLAGGED"
        },
        {
            "full_name": "Siddharth Verma",
            "roll_number": "ME2023034",
            "department": "Mechanical Engineering",
            "year_of_study": 3,
            "email": "siddharth.v@student.edu",
            "status": "REJECTED"
        }
    ]

    for data in verifications_data:
        StudentVerificationRequest.objects.get_or_create(
            email=data["email"],
            defaults={
                "student_id": uuid.uuid4(),
                "full_name": data["full_name"],
                "roll_number": data["roll_number"],
                "department": data["department"],
                "year_of_study": data["year_of_study"],
                "status": data["status"],
                "reviewed_by": faculty_profile if data["status"] != "PENDING" else None,
                "reviewed_at": timezone.now() if data["status"] != "PENDING" else None
            }
        )

    # 3. Seed Organizations
    orgs_data = [
        {
            "name": "Tata Consultancy Services (TCS)",
            "org_type": Organization.OrgType.COMPANY,
            "website": "https://tcs.com",
            "contact_name": "Rajesh Nambiar",
            "contact_email": "campus@tcs.com",
            "contact_phone": "+91 9876543210",
            "verification_status": Organization.VerificationStatus.VERIFIED
        },
        {
            "name": "Infosys Innovation Labs",
            "org_type": Organization.OrgType.COMPANY,
            "website": "https://infosys.com",
            "contact_name": "Sudha Murty",
            "contact_email": "careers@infosys.com",
            "contact_phone": "+91 9812345678",
            "verification_status": Organization.VerificationStatus.VERIFIED
        },
        {
            "name": "Teach For India",
            "org_type": Organization.OrgType.NGO,
            "website": "https://teachforindia.org",
            "contact_name": "Shaheen Mistri",
            "contact_email": "info@teachforindia.org",
            "contact_phone": "+91 9123456789",
            "verification_status": Organization.VerificationStatus.VERIFIED
        },
        {
            "name": "Google India R&D",
            "org_type": Organization.OrgType.COMPANY,
            "website": "https://google.com",
            "contact_name": "Sanjay Gupta",
            "contact_email": "recruiting@google.com",
            "contact_phone": "+91 8001234567",
            "verification_status": Organization.VerificationStatus.VERIFIED
        },
        {
            "name": "Green Earth Eco Foundation",
            "org_type": Organization.OrgType.NGO,
            "website": "https://greenearth.org",
            "contact_name": "Sunita Narain",
            "contact_email": "volunteer@greenearth.org",
            "contact_phone": "+91 9988776655",
            "verification_status": Organization.VerificationStatus.PENDING
        }
    ]

    for odata in orgs_data:
        Organization.objects.get_or_create(
            contact_email=odata["contact_email"],
            defaults={
                "name": odata["name"],
                "org_type": odata["org_type"],
                "website": odata["website"],
                "contact_name": odata["contact_name"],
                "contact_phone": odata["contact_phone"],
                "verification_status": odata["verification_status"],
                "verified_by": faculty_profile
            }
        )

    # 4. Seed Opportunities
    tcs_org = Organization.objects.filter(name__icontains="Tata").first()
    g_org = Organization.objects.filter(name__icontains="Google").first()
    tfi_org = Organization.objects.filter(name__icontains="Teach").first()

    if tcs_org:
        Opportunity.objects.get_or_create(
            title="Software Engineering Intern - Cloud & DevOps",
            organization=tcs_org,
            defaults={
                "opportunity_type": Opportunity.OpportunityType.INTERNSHIP,
                "description": "Work on automated CI/CD pipelines, Kubernetes cluster orchestration, and enterprise microservices architecture.",
                "required_skills": ["Docker", "Kubernetes", "Python", "CI/CD", "AWS"],
                "compensation_amount": 35000.00,
                "compensation_currency": "INR",
                "is_unpaid": False,
                "work_mode": Opportunity.WorkMode.HYBRID,
                "location": "Bangalore / Pune",
                "duration_weeks": 12,
                "application_deadline": timezone.now() + timedelta(days=25),
                "positions_available": 5,
                "status": Opportunity.Status.APPROVED,
                "posted_by": faculty_profile,
                "approved_by": faculty_profile,
                "approved_at": timezone.now()
            }
        )

    if g_org:
        Opportunity.objects.get_or_create(
            title="AI & Full-Stack Research Intern",
            organization=g_org,
            defaults={
                "opportunity_type": Opportunity.OpportunityType.INTERNSHIP,
                "description": "Build high-throughput Web applications integrated with Large Language Models and Sentence-BERT embedding search.",
                "required_skills": ["React", "Python", "PyTorch", "Node.js", "TypeScript"],
                "compensation_amount": 65000.00,
                "compensation_currency": "INR",
                "is_unpaid": False,
                "work_mode": Opportunity.WorkMode.REMOTE,
                "location": "Remote / Hyderabad",
                "duration_weeks": 16,
                "application_deadline": timezone.now() + timedelta(days=40),
                "positions_available": 3,
                "status": Opportunity.Status.APPROVED,
                "posted_by": faculty_profile,
                "approved_by": faculty_profile,
                "approved_at": timezone.now()
            }
        )

    if tfi_org:
        Opportunity.objects.get_or_create(
            title="Digital Literacy & Rural Tech Volunteer",
            organization=tfi_org,
            defaults={
                "opportunity_type": Opportunity.OpportunityType.NGO,
                "description": "Empower rural high school students with modern programming fundamentals and digital tools.",
                "required_skills": ["Python", "Teaching", "Community Engagement"],
                "is_unpaid": True,
                "work_mode": Opportunity.WorkMode.ONSITE,
                "location": "Nashik, Maharashtra",
                "duration_weeks": 8,
                "application_deadline": timezone.now() + timedelta(days=15),
                "positions_available": 10,
                "status": Opportunity.Status.APPROVED,
                "posted_by": faculty_profile,
                "approved_by": faculty_profile,
                "approved_at": timezone.now()
            }
        )

    # 5. Seed Certificates
    if tcs_org:
        Certificate.objects.get_or_create(
            file_url="https://example.com/certificates/cert_aarav_tcs.pdf",
            defaults={
                "student_id": uuid.uuid4(),
                "organization": tcs_org,
                "issue_date": timezone.now().date() - timedelta(days=30),
                "verification_status": Certificate.VerificationStatus.PENDING
            }
        )

    print(f"Database successfully populated! Total verifications: {StudentVerificationRequest.objects.count()}, Organizations: {Organization.objects.count()}, Opportunities: {Opportunity.objects.count()}, Certificates: {Certificate.objects.count()}")

if __name__ == "__main__":
    seed()
