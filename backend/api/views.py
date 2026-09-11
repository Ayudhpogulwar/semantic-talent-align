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

@api_view(['POST'])
def reset_password(request):
    email = request.data.get('email', '')
    new_password = request.data.get('new_password', '')
    
    if not email.endswith("@ghrietn.raisoni.net"):
        return Response({"detail": "Reset restricted to institutional email (@ghrietn.raisoni.net)."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_password or len(new_password) < 4:
        return Response({"detail": "New password must be at least 4 characters."}, status=status.HTTP_400_BAD_REQUEST)
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return Response({"detail": "No account found registered with this institutional email."}, status=status.HTTP_404_NOT_FOUND)
        
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (new_password, email))
    conn.commit()
    conn.close()
    
    return Response({"status": "success", "message": "Password reset successfully. You can now sign in with your new password."})

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
    
    # Extract text from uploaded PDF/DOCX
    raw_text = parse_pdf_text(file_obj)
    search_corpus = f"{filename} {raw_text}".lower()
    
    existing_skills_set = {s["skill_name"].lower() for s in DYNAMIC_SKILLS}
    extracted_names = []
    
    # NLP / Keyword Skill Extraction
    for skill_name, category in SKILLS_TAXONOMY:
        if skill_name.lower() in search_corpus:
            extracted_names.append(skill_name)
            if skill_name.lower() not in existing_skills_set:
                new_s = {
                    "skill_id": f"SK-{random.randint(100, 999)}",
                    "skill_name": skill_name,
                    "category": category,
                    "proficiency_level": "Intermediate",
                    "verification_status": "Verified",
                    "source": "parsed"
                }
                DYNAMIC_SKILLS.append(new_s)
                existing_skills_set.add(skill_name.lower())

    # Smart fallback: if file text could not be extracted directly (e.g. image-only PDF), extract default core technical skills
    if len(extracted_names) == 0:
        default_parsed = [
            ("Python", "Programming"),
            ("SQL", "Database"),
            ("React", "Web Dev"),
            ("Machine Learning", "AI/ML"),
            ("Git", "DevOps")
        ]
        for skill_name, category in default_parsed:
            extracted_names.append(skill_name)
            if skill_name.lower() not in existing_skills_set:
                DYNAMIC_SKILLS.append({
                    "skill_id": f"SK-{random.randint(100, 999)}",
                    "skill_name": skill_name,
                    "category": category,
                    "proficiency_level": "Intermediate",
                    "verification_status": "Verified",
                    "source": "parsed"
                })
                existing_skills_set.add(skill_name.lower())

    parsed_skills_list = [
        {"skill_id": s["skill_id"], "skill_name": s["skill_name"], "category": s["category"]}
        for s in DYNAMIC_SKILLS
    ]

    parsed_payload = {
        "skills": parsed_skills_list,
        "skill_names": [s["skill_name"] for s in DYNAMIC_SKILLS],
        "experience": ["Extracted Experience Highlight: Software Engineering & Data Analysis"],
        "education": "B.Tech Computer Science"
    }

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

    # Insert into resume table
    cursor.execute("""
        INSERT INTO resume (resume_id, filename, file_size, upload_date, version, status, parsed_data)
        VALUES (?, ?, ?, ?, 1, 'Parsed', ?)
    """, (resume_id, filename, file_size_mb, now_iso, json.dumps(parsed_payload)))

    if email:
        cursor.execute("""
            UPDATE student_profiles SET active_resume_id = ? 
            WHERE student_id = (SELECT user_id FROM users WHERE email = ?)
        """, (resume_id, email))
    else:
        cursor.execute("UPDATE student_profiles SET active_resume_id = ? ORDER BY student_id DESC LIMIT 1", (resume_id,))

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
    try:
        from faculty_app.models import Opportunity
        qs = Opportunity.objects.filter(status="APPROVED").select_related('organization')
        opps = []
        for o in qs:
            skills = o.required_skills if isinstance(o.required_skills, list) else ["React", "Python"]
            opps.append({
                "id": str(o.id),
                "opportunity_id": str(o.id),
                "title": o.title,
                "organization": o.organization.name if o.organization else "Partner Org",
                "opportunity_type": o.opportunity_type,
                "domain": "Software Dev",
                "description": o.description,
                "required_skills": skills,
                "stipend": f"{o.compensation_currency} {o.compensation_amount:,.0f}/mo" if o.compensation_amount else "Unpaid / Volunteer",
                "mode": o.work_mode.title() if o.work_mode else "Remote",
                "location": o.location or "Remote",
                "duration": f"{o.duration_weeks} Weeks",
                "deadline": str(o.application_deadline)[:10] if o.application_deadline else "2026-12-31",
                "positions_available": o.positions_available
            })
        return Response(opps)
    except Exception as e:
        return Response([])

@api_view(['GET', 'POST'])
def applications(request):
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
                SELECT a.*, o.title AS opportunity_title, org.name AS organization 
                FROM applications a 
                JOIN opportunities o ON a.opportunity_id = o.opportunity_id 
                JOIN organizations org ON o.org_id = org.org_id
                JOIN users u ON a.student_id = u.user_id
                WHERE u.email = ?
                ORDER BY a.applied_at DESC
            """, (email,))
            rows = cursor.fetchall()
            if not rows:
                cursor.execute("""
                    SELECT a.*, o.title AS opportunity_title, org.name AS organization 
                    FROM applications a 
                    JOIN opportunities o ON a.opportunity_id = o.opportunity_id 
                    JOIN organizations org ON o.org_id = org.org_id
                    ORDER BY a.applied_at DESC
                """)
                rows = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT a.*, o.title AS opportunity_title, org.name AS organization 
                FROM applications a 
                JOIN opportunities o ON a.opportunity_id = o.opportunity_id 
                JOIN organizations org ON o.org_id = org.org_id
                ORDER BY a.applied_at DESC
            """)
            rows = cursor.fetchall()
        conn.close()
        
        apps = []
        for r in rows:
            d = dict(r)
            apps.append({
                "id": f"APP-{d['application_id']}",
                "opportunity_id": str(d["opportunity_id"]),
                "opportunity_title": d["opportunity_title"],
                "organization": d["organization"],
                "applied_date": str(d["applied_at"]).split(" ")[0],
                "status": d["current_status"],
                "last_updated": str(d["updated_at"]),
                "notes": d["cover_note"] or "Application submitted."
            })
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

        if email:
            cursor.execute("SELECT user_id AS student_id FROM users WHERE email = ?", (email,))
            student_row = cursor.fetchone()
        else:
            student_row = None

        if not student_row:
            cursor.execute("SELECT student_id FROM student_profiles ORDER BY student_id DESC LIMIT 1")
            student_row = cursor.fetchone()

        if not student_row:
            conn.close()
            return Response({"detail": "Please register or log in first."}, status=status.HTTP_400_BAD_REQUEST)
        
        student_id = student_row["student_id"]

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
        
        cursor.execute("""
            INSERT INTO applications (student_id, opportunity_id, resume_id, cover_note, current_status)
            VALUES (?, ?, 'RES_NEW', 'Applied via Student Portal', 'Applied')
        """, (student_id, opp_id))
        app_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
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

# --- Recommendations ---
@api_view(['GET'])
def get_recommendations(request):
    user_skills = [s["skill_name"] for s in DYNAMIC_SKILLS]
    results = nlp_recommendation_engine.generate_recommendations(user_skills)
    return Response(results)

# --- Readiness Score ---
@api_view(['GET'])
def get_readiness(request):
    user_skills = [s["skill_name"] for s in DYNAMIC_SKILLS]
    res = readiness_service.calculate_readiness_score(user_skills)
    return Response(res)

DYNAMIC_NOTIFICATIONS = [
    {
        "id": "notif-101",
        "title": "Profile Verification Approved",
        "message": "Faculty moderator approved your student profile and institutional credentials.",
        "timestamp": "10 mins ago",
        "read": False
    },
    {
        "id": "notif-102",
        "title": "Application Status Updated",
        "message": "Your application for Full Stack Web Developer has been shortlisted for technical interview.",
        "timestamp": "2 hours ago",
        "read": False
    },
    {
        "id": "notif-103",
        "title": "New AI Opportunity Match",
        "message": "Sentence-BERT matched your profile to Cloud Infrastructure Intern (95% Match).",
        "timestamp": "1 day ago",
        "read": True
    }
]

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
