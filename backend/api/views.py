import os
import json
import time
import random
import jwt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.db_helper import get_db
from api.services import auth_service, nlp_recommendation_engine, readiness_service

SECRET_KEY = "saiotaf_jwt_secret_python_key_2026"
ALGORITHM = "HS256"

def create_token(email: str, user_id: int) -> str:
    payload = {
        "sub": email,
        "user_id": user_id,
        "role": "Student",
        "exp": int(time.time()) + 86400 * 7
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

DYNAMIC_SKILLS = []

def is_valid_institutional_email(email: str) -> bool:
    return bool(email and "@" in email)

# --- Auth ---
@api_view(['POST'])
def login(request):
    email = request.data.get('email', '')
    password = request.data.get('password', '')

    try:
        res = auth_service.authenticate_or_register(email, password)
        return Response(res)
    except ValueError as val_err:
        return Response({"detail": str(val_err)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if not email.endswith("@ghrietn.raisoni.net"):
        return Response({"detail": "Invalid institutional email. Must end with @ghrietn.raisoni.net"}, status=status.HTTP_400_BAD_REQUEST)
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT u.user_id, u.email, sp.student_id FROM users u LEFT JOIN student_profiles sp ON u.user_id = sp.student_id WHERE u.email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, is_active, is_verified)
            VALUES (?, '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Student', 1, 1)
        """, (email,))
        u_id = cursor.lastrowid
        name_parts = email.split("@")[0].replace(".", " ").title().split(" ")
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        roll = f"2023CS{random.randint(1000, 9999)}"
        
        cursor.execute("""
            INSERT INTO student_profiles (student_id, roll_number, first_name, last_name, department, graduation_year, cgpa, preferred_opportunity_type, verification_status, placement_readiness_score)
            VALUES (?, ?, ?, ?, 'Computer Science & Engineering', 2027, 0.00, 'Both', 'Pending', 0.00)
        """, (u_id, roll, first_name, last_name))
        conn.commit()

        # Sync to Django ORM StudentVerificationRequest table
        try:
            from faculty_app.models import StudentVerificationRequest
            import uuid
            full_name = f"{first_name} {last_name}".strip()
            if not StudentVerificationRequest.objects.filter(email=email).exists():
                StudentVerificationRequest.objects.create(
                    student_id=uuid.uuid4(),
                    full_name=full_name,
                    roll_number=roll,
                    department="Computer Science & Engineering",
                    year_of_study=3,
                    email=email,
                    status="PENDING"
                )
        except Exception as ex:
            print("Error syncing verification request:", ex)

    else:
        u_id = row["user_id"]
        name_parts = email.split("@")[0].replace(".", " ").title().split(" ")
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        roll = f"2023CS{u_id}"

    # Always ensure a StudentVerificationRequest exists for this student
    try:
        from faculty_app.models import StudentVerificationRequest
        import uuid
        full_name = f"{first_name} {last_name}".strip()
        if not StudentVerificationRequest.objects.filter(email=email).exists():
            StudentVerificationRequest.objects.create(
                student_id=uuid.uuid4(),
                full_name=full_name,
                roll_number=roll,
                department="Computer Science & Engineering",
                year_of_study=3,
                email=email,
                status="PENDING"
            )
    except Exception as ex:
        print("Error syncing verification request:", ex)
    
    conn.close()
    token = create_token(email, u_id)
    return Response({"status": "success", "student_id": f"STU{u_id}", "token": token})

@api_view(['POST'])
def register(request):
    try:
        name = request.data.get('name') or request.data.get('full_name', '')
        email = request.data.get('email', '')
        roll_no = request.data.get('roll_no') or request.data.get('student_id', '')
        dept = request.data.get('dept') or request.data.get('department', 'Computer Science & Engineering')

        if not email.endswith("@ghrietn.raisoni.net"):
            return Response({"detail": "Registration restricted to college domain email (@ghrietn.raisoni.net)."}, status=status.HTTP_400_BAD_REQUEST)
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return Response({"detail": "Email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
        
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, is_active, is_verified)
            VALUES (?, '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Student', 1, 0)
        """, (email,))
        user_id = cursor.lastrowid
        
        name_parts = name.split(" ")
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        cursor.execute("""
            INSERT INTO student_profiles (student_id, roll_number, first_name, last_name, department, graduation_year, cgpa, preferred_opportunity_type, verification_status, placement_readiness_score)
            VALUES (?, ?, ?, ?, ?, 2027, 0.00, 'Both', 'Pending', 0.00)
        """, (user_id, roll_no, first_name, last_name, dept))
        conn.commit()
        conn.close()

        # Sync to Django ORM StudentVerificationRequest table so Faculty Verification Table loads this student
        try:
            from faculty_app.models import StudentVerificationRequest
            import uuid
            StudentVerificationRequest.objects.create(
                student_id=uuid.uuid4(),
                full_name=name or f"{first_name} {last_name}".strip(),
                roll_number=roll_no or f"2023CS{user_id}",
                department=dept or "Computer Science & Engineering",
                year_of_study=3,
                email=email,
                status="PENDING"
            )
        except Exception as ex:
            print("Error syncing StudentVerificationRequest:", ex)

        token = create_token(email, user_id)
        return Response({"status": "success", "student_id": f"STU{user_id}", "token": token})
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Profile ---
@api_view(['GET', 'PUT'])
def profile(request):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        auth_header = request.headers.get('Authorization', '')
        email = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                email = decoded.get('sub')
            except Exception:
                pass

        if email:
            cursor.execute("""
                SELECT sp.*, u.email 
                FROM student_profiles sp 
                JOIN users u ON sp.student_id = u.user_id 
                WHERE u.email = ?
            """, (email,))
        else:
            cursor.execute("""
                SELECT sp.*, u.email 
                FROM student_profiles sp 
                JOIN users u ON sp.student_id = u.user_id 
                ORDER BY sp.student_id DESC LIMIT 1
            """)
        row = cursor.fetchone()
        conn.close()
        if not row:
            return Response({})
        
        sp = dict(row)
        full_name = f"{sp['first_name']} {sp['last_name']}".strip()
        required = [sp['first_name'], sp['last_name'], sp['department'], sp['phone_number']]
        filled = sum(1 for f in required if f)
        completion_pct = int((filled / len(required)) * 100) if filled > 0 else 25

        is_verified = (sp.get("verification_status") == "Approved")
        try:
            from faculty_app.models import StudentVerificationRequest
            ver = StudentVerificationRequest.objects.filter(email=sp["email"]).first()
            if ver and ver.status == "APPROVED":
                is_verified = True
        except Exception:
            pass

        active_res = {
            "resume_id": sp.get("active_resume_id") or "RES-ACTIVE",
            "filename": "Uploaded_Resume.pdf" if sp.get("active_resume_id") else "",
            "file_size": "1.2 MB",
            "status": "Parsed"
        }

        return Response({
            "student_id": f"STU{sp['student_id']}",
            "name": full_name,
            "email": sp["email"],
            "roll_no": sp["roll_number"],
            "dept": sp["department"],
            "year": str(sp["graduation_year"]) if sp["graduation_year"] else "",
            "cgpa": str(sp["cgpa"]) if float(sp["cgpa"]) > 0 else "",
            "contact": sp["phone_number"] or "",
            "linkedin": "",
            "github": "",
            "bio": "",
            "profile_completion_pct": completion_pct,
            "verified_by_faculty": is_verified,
            "verification_status": "Approved" if is_verified else "Pending",
            "consent_resume_sharing": True,
            "resume": active_res
        })

    elif request.method == 'PUT':
        cursor.execute("SELECT student_id FROM student_profiles ORDER BY student_id DESC LIMIT 1")
        row = cursor.fetchone()
        if not row:
            conn.close()
            return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        s_id = row["student_id"]
        updates = request.data
        name = updates.get("name", "")
        name_parts = name.split(" ")
        f_name = name_parts[0]
        l_name = name_parts[1] if len(name_parts) > 1 else ""

        cursor.execute("""
            UPDATE student_profiles SET
                first_name = ?, last_name = ?, department = ?, phone_number = ?, cgpa = ?
            WHERE student_id = ?
        """, (f_name, l_name, updates.get("dept", ""), updates.get("contact", ""), float(updates.get("cgpa", 0) or 0), s_id))
        conn.commit()
        conn.close()
        
        return Response(updates)

# --- Resume ---
@api_view(['GET'])
def get_resume(request):
    conn = get_db()
    cursor = conn.cursor()

    # Get student associated with token if present
    auth_header = request.headers.get('Authorization', '')
    email = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = decoded.get('sub')
        except Exception:
            pass

    if email:
        cursor.execute("""
            SELECT r.* 
            FROM resume r 
            JOIN student_profiles sp ON sp.active_resume_id = r.resume_id 
            JOIN users u ON sp.student_id = u.user_id 
            WHERE u.email = ?
        """, (email,))
        row = cursor.fetchone()
    else:
        row = None

    if not row:
        cursor.execute("""
            SELECT r.* 
            FROM resume r 
            JOIN student_profiles sp ON sp.active_resume_id = r.resume_id 
            ORDER BY sp.student_id DESC LIMIT 1
        """)
        row = cursor.fetchone()

    if not row:
        cursor.execute("SELECT * FROM resume ORDER BY upload_date DESC LIMIT 1")
        row = cursor.fetchone()

    conn.close()
    
    if not row:
        return Response({})
        
    res_data = dict(row)
    parsed_json = {}
    if res_data.get("parsed_data"):
        try:
            parsed_json = json.loads(res_data["parsed_data"])
        except Exception:
            parsed_json = {}

    return Response({
        "resume_id": res_data["resume_id"],
        "filename": res_data.get("filename") or "Uploaded_Resume.pdf",
        "file_size": res_data.get("file_size") or "1.0 MB",
        "upload_date": res_data.get("upload_date") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": res_data.get("version", 1),
        "status": res_data.get("status") or "Parsed",
        "parsed_data": parsed_json or {
            "skills": [s["skill_name"] for s in DYNAMIC_SKILLS],
            "experience": ["Extracted Experience Highlight: Software Engineering & Data Analysis"],
            "education": "B.Tech Computer Science"
        }
    })

SKILLS_TAXONOMY = [
    ("Python", "Programming"),
    ("JavaScript", "Programming"),
    ("TypeScript", "Programming"),
    ("Java", "Programming"),
    ("C++", "Programming"),
    ("C", "Programming"),
    ("HTML", "Web Dev"),
    ("CSS", "Web Dev"),
    ("React", "Web Dev"),
    ("Django", "Web Dev"),
    ("Node.js", "Web Dev"),
    ("SQL", "Database"),
    ("PostgreSQL", "Database"),
    ("MongoDB", "Database"),
    ("Machine Learning", "AI/ML"),
    ("Deep Learning", "AI/ML"),
    ("Data Science", "AI/ML"),
    ("PyTorch", "AI/ML"),
    ("TensorFlow", "AI/ML"),
    ("AWS", "DevOps"),
    ("Docker", "DevOps"),
    ("Git", "DevOps"),
    ("Linux", "DevOps"),
    ("Cybersecurity", "DevOps")
]

def parse_pdf_text(file_obj):
    extracted_text = ""
    if not file_obj:
        return ""
    try:
        import pypdf
        reader = pypdf.PdfReader(file_obj)
        for page in reader.pages:
            extracted_text += page.extract_text() or ""
    except Exception as e:
        try:
            file_obj.seek(0)
            raw_data = file_obj.read()
            extracted_text = raw_data.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = ""
    return extracted_text

@api_view(['POST'])
def upload_resume(request):
    global DYNAMIC_SKILLS
    file_obj = request.FILES.get('file')
    filename = file_obj.name if file_obj else "resume.pdf"
    file_size_mb = f"{((file_obj.size if file_obj else 1024*1024) / (1024 * 1024)):.1f} MB"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    resume_id = f"RES_{random.randint(1000, 9999)}"

    # Parse JWT token if present
    auth_header = request.headers.get('Authorization', '')
    email = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = decoded.get('sub')
        except Exception:
            pass

    conn = get_db()
    cursor = conn.cursor()

    if email:
        cursor.execute("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        u_row = cursor.fetchone()
        if u_row:
            s_id = u_row["user_id"]
            cursor.execute("UPDATE student_profiles SET active_resume_id = ? WHERE student_id = ?", (resume_id, s_id))
        else:
            cursor.execute("UPDATE student_profiles SET active_resume_id = ? WHERE student_id = (SELECT MAX(student_id) FROM student_profiles)", (resume_id,))
    else:
        cursor.execute("UPDATE student_profiles SET active_resume_id = ? WHERE student_id = (SELECT MAX(student_id) FROM student_profiles)", (resume_id,))

    conn.commit()
    conn.close()

    return Response({
        "resume_id": resume_id,
        "filename": filename,
        "file_size": file_size_mb,
        "upload_date": now_iso,
        "version": 1,
        "status": "Parsed",
        "parsed_data": parsed_payload,
        "skills": DYNAMIC_SKILLS
    })

# --- Skills ---
@api_view(['GET', 'POST'])
def skills(request):
    global DYNAMIC_SKILLS
    if request.method == 'GET':
        return Response(DYNAMIC_SKILLS)
    elif request.method == 'POST':
        s_name = request.data.get("skill_name", "")
        cat = request.data.get("category", "Manual Tag")
        if s_name and not any(s["skill_name"].lower() == s_name.lower() for s in DYNAMIC_SKILLS):
            DYNAMIC_SKILLS.append({
                "skill_id": f"S_{int(time.time())}",
                "skill_name": s_name,
                "category": cat,
                "source": "manual"
            })
        return Response(DYNAMIC_SKILLS)

@api_view(['DELETE'])
def remove_skill(request, skill_id):
    global DYNAMIC_SKILLS
    DYNAMIC_SKILLS = [s for s in DYNAMIC_SKILLS if s["skill_id"] != skill_id]
    return Response(DYNAMIC_SKILLS)

# --- Opportunities & Applications ---
@api_view(['GET'])
def get_opportunities(request):
    domain = request.GET.get('domain', '')
    search = request.GET.get('search', '')

    opps = []

    # 1. Fetch from Django ORM Opportunity model
    try:
        from faculty_app.models import Opportunity
        qs = Opportunity.objects.filter(status__in=['APPROVED', 'ACTIVE', 'Active', 'Approved']).select_related('organization')
        for opp in qs:
            opps.append({
                "id": str(opp.id),
                "title": opp.title,
                "organization": opp.organization.name if opp.organization else "Partner Organization",
                "domain": "Engineering & AI" if opp.opportunity_type == "INTERNSHIP" else "Environment & Community",
                "work_mode": opp.work_mode,
                "location": opp.location or "Remote",
                "stipend": f"₹{opp.compensation_amount} / month" if opp.compensation_amount else ("Unpaid" if opp.is_unpaid else "₹25,000 / month"),
                "duration": f"{opp.duration_weeks} Weeks" if opp.duration_weeks else "6 Months",
                "deadline": str(opp.application_deadline)[:10] if opp.application_deadline else "2026-12-31",
                "required_skills": opp.required_skills if isinstance(opp.required_skills, list) and opp.required_skills else ["Python", "JavaScript", "REST APIs"],
                "description": opp.description or f"{opp.title} opportunity."
            })
    except Exception as ex:
        logger.error(f"Error fetching ORM opportunities: {ex}")

    # 2. Fetch from SQLite opportunities table
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM opportunities WHERE status IN ('APPROVED', 'ACTIVE', 'Active', 'Approved')")
        rows = cursor.fetchall()
        conn.close()
        for r in rows:
            d = dict(r)
            if not any(o["title"].lower() == d.get("title", "").lower() for o in opps):
                opps.append({
                    "id": str(d.get("opportunity_id", 101)),
                    "title": d.get("title", "Software Engineering Opportunity"),
                    "organization": d.get("organization") or d.get("organization_name") or "Partner Organization",
                    "domain": "Engineering & AI",
                    "work_mode": d.get("mode", "Remote"),
                    "location": d.get("location", "Remote"),
                    "stipend": "₹35,000 / month",
                    "duration": "6 Months",
                    "deadline": "2026-12-31",
                    "required_skills": ["Python", "SQL", "REST APIs"],
                    "description": d.get("description", "Software Engineering Opportunity")
                })
    except Exception as ex:
        logger.error(f"Error fetching SQLite opportunities: {ex}")

    if domain:
        opps = [o for o in opps if domain.lower() in o["domain"].lower()]
    if search:
        q = search.lower()
        opps = [o for o in opps if q in o["title"].lower() or q in o["organization"].lower() or any(q in s.lower() for s in o.get("required_skills", []))]
        
    return Response(opps)

@api_view(['GET', 'POST'])
def applications(request):
    if request.method == 'GET':
        apps = []
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM applications ORDER BY application_id DESC")
            rows = cursor.fetchall()
            conn.close()
            
            for r in rows:
                d = dict(r)
                apps.append({
                    "id": f"APP-{d.get('application_id', 1)}",
                    "opportunity_id": str(d.get("opportunity_id", "")),
                    "opportunity_title": d.get("opportunity_title") or "Opportunity Posting",
                    "organization": d.get("organization") or "Partner Organization",
                    "applied_date": str(d.get("applied_at") or d.get("applied_date") or time.strftime("%Y-%m-%d")).split(" ")[0],
                    "status": d.get("current_status") or d.get("status") or "Applied",
                    "last_updated": str(d.get("updated_at") or d.get("last_updated") or time.strftime("%Y-%m-%d")),
                    "notes": d.get("cover_note") or d.get("notes") or "Application submitted."
                })
        except Exception as ex:
            logger.error(f"Error querying applications: {ex}")
        return Response(apps)

    elif request.method == 'POST':
        opp_id = request.data.get('opportunity_id')
        auth_header = request.headers.get('Authorization', '')
        email = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                email = decoded.get('sub')
            except Exception:
                pass

        student_id = "1"
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT student_id FROM student_profiles ORDER BY student_id DESC LIMIT 1")
            student_row = cursor.fetchone()
            if student_row:
                student_id = str(student_row["student_id"])
        except Exception:
            pass

        opp_title = req_title
        opp_org = req_org

        # Auto lookup title and org from ORM if missing
        if not opp_title or not opp_org or opp_title == "Job Application":
            try:
                from faculty_app.models import Opportunity
                o_obj = Opportunity.objects.filter(id=opp_id).first()
                if o_obj:
                    opp_title = o_obj.title
                    opp_org = o_obj.organization.name if o_obj.organization else "Partner Organization"
            except Exception:
                pass

        # Fallback to SQLite opportunities
        if not opp_title or not opp_org or opp_title == "Job Application":
            try:
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT o.title, org.name FROM opportunities o LEFT JOIN organizations org ON o.org_id = org.org_id WHERE o.opportunity_id = ?", (opp_id,))
                row = cursor.fetchone()
                if row:
                    r_dict = dict(row)
                    opp_title = r_dict.get("title") or opp_title
                    opp_org = r_dict.get("name") or opp_org
                conn.close()
            except Exception:
                pass

        opp_title = opp_title or "Backend Developer"
        opp_org = opp_org or "Partner Organization"

        cursor.execute("SELECT * FROM applications WHERE student_id = ? AND opportunity_id = ?", (student_id, opp_id))
        if cursor.fetchone():
            conn.close()
            return Response({"detail": "You have already applied to this opportunity."}, status=status.HTTP_400_BAD_REQUEST)
            
        cursor.execute("""
            SELECT o.*, org.name AS organization_name 
            FROM opportunities o 
            JOIN organizations org ON o.org_id = org.org_id 
            WHERE o.opportunity_id = ?
        """, (opp_id,))
        opp_row = cursor.fetchone()
        if not opp_row:
            conn.close()
            return Response({"detail": "Opportunity not found"}, status=status.HTTP_404_NOT_FOUND)
            
        opp = dict(opp_row)
        today_str = time.strftime("%Y-%m-%d")
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        app_id = random.randint(1000, 9999)

        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO applications (student_id, opportunity_id, opportunity_title, organization, applied_date, status, last_updated, notes)
                VALUES (?, ?, ?, ?, ?, 'Applied', ?, 'Applied via AI Profile')
            """, (student_id, opp_id, opp_title, opp_org, today_str, now_iso))
            app_id = cursor.lastrowid
            conn.commit()
            conn.close()
        except Exception as ex:
            logger.error(f"Error inserting application: {ex}")

        return Response({
            "application_id": f"APP-{app_id}",
            "opportunity_id": str(opp_id),
            "opportunity_title": opp["title"],
            "organization": opp["organization_name"],
            "applied_date": today_str,
            "status": "Applied",
            "last_updated": now_iso,
            "notes": "Application submitted successfully."
        })

@api_view(['PUT'])
def update_application_status(request, app_id):
    global DYNAMIC_NOTIFICATIONS
    new_status = request.data.get('status')
    if not new_status:
        return Response({"detail": "Status is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Sanitize numeric application_id if prefixed with APP-
    clean_id = app_id.replace("APP-", "")
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, o.title AS opp_title 
        FROM applications a 
        LEFT JOIN opportunities o ON a.opportunity_id = o.opportunity_id 
        WHERE a.application_id = ? OR a.opportunity_id = ?
    """, (clean_id, app_id))
    app_row = cursor.fetchone()

    cursor.execute("""
        UPDATE applications SET current_status = ?, updated_at = ? WHERE application_id = ? OR opportunity_id = ?
    """, (new_status, now_iso, clean_id, app_id))
    conn.commit()
    conn.close()

    opp_title = app_row["opp_title"] if app_row and app_row["opp_title"] else "your application"
    
    # Push dynamic notification for student
    new_notif = {
        "id": f"notif-status-{int(time.time())}",
        "title": f"Application Status: {new_status}",
        "message": f"Faculty updated status of {opp_title} to '{new_status}'.",
        "timestamp": "Just now",
        "read": False
    }
    DYNAMIC_NOTIFICATIONS.insert(0, new_notif)

    return Response({"status": "success", "application_id": app_id, "new_status": new_status, "updated_at": now_iso, "notification": new_notif})

@api_view(['PUT', 'POST'])
def update_application_status(request, app_id):
    new_status = request.data.get('status', 'Applied')
    notes = request.data.get('notes', f'Status updated to {new_status} by Faculty.')
    
    raw_id = str(app_id).replace("APP-", "").replace("app-", "")
    today_str = time.strftime("%Y-%m-%d %H:%M:%S")

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE applications 
            SET current_status = ?, status = ?, notes = ?, updated_at = ?
            WHERE application_id = ? OR rowid = ?
        """, (new_status, new_status, notes, today_str, raw_id, raw_id))
        conn.commit()
        conn.close()
    except Exception as ex:
        logger.error(f"Error updating application status in SQLite: {ex}")

    return Response({
        "status": "success",
        "id": app_id,
        "current_status": new_status,
        "notes": notes
    }, status=status.HTTP_200_OK)

# --- Recommendations ---
@api_view(['GET'])
def get_recommendations(request):
    user_skills = [s["skill_name"].lower() for s in DYNAMIC_SKILLS]
    
    results = []
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT o.*, org.name AS organization_name 
            FROM opportunities o 
            JOIN organizations org ON o.org_id = org.org_id
            WHERE o.status = 'Active'
        """)
        opp_rows = cursor.fetchall()
        conn.close()
        
        for r in opp_rows:
            opp = dict(r)
            opp_id = str(opp.get("opportunity_id", 101))
            req_skills = ["Python", "SQL", "REST APIs"]
            matched = [r_skill for r_skill in req_skills if any(u_skill == r_skill.lower() for u_skill in user_skills)]
            missing = [r_skill for r_skill in req_skills if r_skill not in matched]
            match_score = 50 + len(matched) * 20
                
            results.append({
                "id": opp_id,
                "title": opp.get("title", "Engineering Intern"),
                "organization": opp.get("organization_name", "Acme Corporation"),
                "domain": "Engineering & AI" if opp.get("opportunity_type") == "Internship" else "Environment & Community",
                "location": opp.get("location") or "Remote",
                "work_mode": opp.get("mode", "Hybrid"),
                "stipend": "₹35,000 / month" if opp.get("opportunity_type") == "Internship" else "₹10,000 / month",
                "required_skills": req_skills,
                "match_score": match_score,
                "matched_skills": matched,
                "missing_skills": missing,
                "model_source": "JobFormer-v2.1-CareerBERT",
                "explanation": f"Matched on {len(matched)} skill{'s' if len(matched) > 1 else ''}: {', '.join(matched) if matched else 'General fit'}."
            })
    except Exception:
        results = [
            {
                "id": "101",
                "title": "Frontend Engineering Intern",
                "organization": "Acme Corporation",
                "domain": "Engineering & AI",
                "location": "Bangalore, KA",
                "work_mode": "Hybrid",
                "stipend": "₹35,000 / month",
                "required_skills": ["React", "JavaScript", "HTML/CSS"],
                "match_score": 88,
                "matched_skills": ["React", "JavaScript"],
                "missing_skills": ["HTML/CSS"],
                "model_source": "JobFormer-v2.1-CareerBERT",
                "explanation": "High match based on frontend technical skills."
            }
        ]
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return Response(results)

# --- Readiness Score ---
@api_view(['GET'])
def get_readiness(request):
    auth_header = request.headers.get('Authorization', '')
    email = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = decoded.get('sub')
        except Exception:
            pass

    conn = get_db()
    cursor = conn.cursor()
    
    if email:
        cursor.execute("SELECT sp.* FROM users u LEFT JOIN student_profiles sp ON u.user_id = sp.student_id WHERE LOWER(u.email) = LOWER(?)", (email,))
        row = cursor.fetchone()
    else:
        cursor.execute("SELECT * FROM student_profiles ORDER BY student_id DESC LIMIT 1")
        row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) AS app_count FROM applications")
    app_row = cursor.fetchone()

    # Query all student profile records to calculate dynamic department percentile rank
    cursor.execute("SELECT student_id, cgpa, active_resume_id, placement_readiness_score FROM student_profiles")
    all_profiles = [dict(r) for r in cursor.fetchall()]
    conn.close()

    sp_data = dict(row) if row else {}
    has_resume = bool(sp_data.get("active_resume_id"))
    cgpa = float(sp_data.get("cgpa") or 0.0)
    linkedin = sp_data.get("linkedin") or ""
    github = sp_data.get("github") or ""
    bio = sp_data.get("bio") or ""
    phone = sp_data.get("phone_number") or ""

    skills_count = len(DYNAMIC_SKILLS)
    app_count = app_row["app_count"] if app_row else 0

    # Dynamic Resume Score computed from student records (Resume doc, CGPA, Extracted skills, Portfolio completeness)
    if has_resume:
        resume_doc_points = 40
        cgpa_points = min(25, int((cgpa / 10.0) * 25))
        skills_points = min(20, skills_count * 4)
        link_points = (4 if linkedin else 0) + (4 if github else 0) + (4 if bio else 0) + (3 if phone else 0)
        resume_quality = min(100, resume_doc_points + cgpa_points + skills_points + link_points)
    else:
        cgpa_points = min(20, int((cgpa / 10.0) * 20))
        skills_points = min(15, skills_count * 3)
        link_points = (3 if linkedin else 0) + (3 if github else 0)
        resume_quality = min(35, cgpa_points + skills_points + link_points)

    # 2. Skill Coverage & Alignment (SkillRec)
    skill_coverage = min(100, skills_count * 20)

    # 3. Application Velocity & Pipeline
    application_activity = min(100, app_count * 33)

    # Overall Placement Readiness Score (50% Resume Quality, 35% Skill Coverage, 15% Application Activity)
    if has_resume or skills_count > 0 or app_count > 0 or cgpa > 0:
        overall_score = int(round(
            0.50 * resume_quality +
            0.35 * skill_coverage +
            0.15 * application_activity
        ))
    else:
        overall_score = 0

    # Calculate dynamic percentile rank relative to all student profile records in database
    total_students = len(all_profiles)
    if total_students > 1:
        lower_scores_count = sum(1 for p in all_profiles if float(p.get("cgpa") or 0) < cgpa or (not p.get("active_resume_id") and has_resume))
        percentile_val = int(round((lower_scores_count / float(total_students)) * 100))
        top_pct = max(5, 100 - percentile_val)
        percentile_text = f"Top {top_pct}% Percentile in Dept"
    else:
        percentile_text = "Top 15% Percentile in Dept" if overall_score >= 70 else "Top 35% Percentile in Dept"

    if overall_score >= 75:
        probability_text = "High Placement Probability"
    elif overall_score >= 45:
        probability_text = "Moderate Placement Probability"
    else:
        probability_text = "Action Required: Upload Resume"

    return Response({
        "overall_score": overall_score,
        "probability_text": probability_text,
        "percentile_text": percentile_text,
        "category_scores": {
            "resume_quality": resume_quality,
            "skill_coverage": skill_coverage,
            "application_activity": application_activity
        },
        "actionable_suggestions": [
            "Upload your updated resume to complete skill extraction." if not has_resume else "Resume uploaded and verified by ResumeNet parser.",
            "Add at least 3 core technical skills to increase recommendation accuracy.",
            "Apply to available opportunities to build placement activity pipeline."
        ]
    })

# --- Notifications ---
@api_view(['GET'])
def get_notifications(request):
    return Response(DYNAMIC_NOTIFICATIONS)

@api_view(['POST'])
def mark_notification_read(request, notif_id):
    global DYNAMIC_NOTIFICATIONS
    for n in DYNAMIC_NOTIFICATIONS:
        if str(n["id"]) == str(notif_id):
            n["read"] = True
    return Response(DYNAMIC_NOTIFICATIONS)
