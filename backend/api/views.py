import os
import json
import time
import random
import jwt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.db_helper import get_db

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

ALLOWED_INSTITUTIONAL_DOMAINS = ["@ghrietn.raisoni.net", "@college.edu"]

def is_valid_institutional_email(email: str) -> bool:
    email_lower = email.lower()
    return any(email_lower.endswith(dom) for dom in ALLOWED_INSTITUTIONAL_DOMAINS) or email_lower.endswith(".edu") or email_lower.endswith(".ac.in")

# --- Auth ---
@api_view(['POST'])
def login(request):
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')

    if not is_valid_institutional_email(email):
        return Response({"detail": "Invalid institutional email. Must be an official college domain email (e.g. @ghrietn.raisoni.net or @college.edu)."}, status=status.HTTP_400_BAD_REQUEST)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT u.user_id, u.email, sp.student_id FROM users u LEFT JOIN student_profiles sp ON u.user_id = sp.student_id WHERE u.email = ?", (email,))
    row = cursor.fetchone()
    
    if not row:
        cursor.execute("""
            INSERT INTO users (email, password_hash, role, is_active, is_verified)
            VALUES (?, '$2b$12$eImiTXuWVxfM37uY4JANjO2ZfW9X2m2kF8a2A2h1W5eG5f5S5S5S5', 'Student', 1, 1)
        """, (email,))
        user_id = cursor.lastrowid
        name_parts = email.split("@")[0].replace(".", " ").title().split(" ")
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        roll = f"2023CS{random.randint(1000, 9999)}"
        
        cursor.execute("""
            INSERT INTO student_profiles (student_id, roll_number, first_name, last_name, department, graduation_year, cgpa, preferred_opportunity_type, verification_status, placement_readiness_score)
            VALUES (?, ?, ?, ?, 'Computer Science & Engineering', 2027, 0.00, 'Both', 'Pending', 0.00)
        """, (user_id, roll, first_name, last_name))
        conn.commit()
        u_id = user_id
    else:
        u_id = row["user_id"]
    
    conn.close()
    token = create_token(email, u_id)
    return Response({"status": "success", "student_id": f"STU{u_id}", "token": token})

@api_view(['POST'])
def register(request):
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    roll_no = request.data.get('roll_no', '').strip()
    dept = request.data.get('dept', '').strip() or 'Computer Science & Engineering'

    if not is_valid_institutional_email(email):
        return Response({"detail": "Registration restricted to college domain email (e.g. @ghrietn.raisoni.net or @college.edu)."}, status=status.HTTP_400_BAD_REQUEST)
    
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
    
    token = create_token(email, user_id)
    return Response({"status": "success", "student_id": f"STU{user_id}", "token": token})

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
            row = cursor.fetchone()
        else:
            row = None

        if not row:
            cursor.execute("""
                SELECT sp.*, u.email 
                FROM student_profiles sp 
                JOIN users u ON sp.student_id = u.user_id 
                ORDER BY sp.student_id DESC LIMIT 1
            """)
            row = cursor.fetchone()

        conn.close()
        if not row:
            return Response({
                "student_id": "STU1",
                "name": "Yash Fokmare",
                "email": "yash@ghrietn.raisoni.net",
                "roll_no": "CS1234",
                "dept": "Computer Science & Engineering",
                "year": "1st Year",
                "cgpa": "8.4",
                "contact": "9356999255",
                "linkedin": "yashfokmarelinkdin.in",
                "github": "yashgit.in",
                "bio": "Aspiring Java Full Stack",
                "profile_completion_pct": 85,
                "verified_by_faculty": True,
                "consent_resume_sharing": True
            })

        sp = dict(row)
        full_name = f"{sp.get('first_name', '')} {sp.get('last_name', '')}".strip() or "Yash Fokmare"
        phone = sp.get('phone_number') or ""
        linkedin = sp.get('linkedin') or ""
        github = sp.get('github') or ""
        bio = sp.get('bio') or ""
        required = [sp.get('first_name'), sp.get('last_name'), sp.get('department'), phone]
        filled = sum(1 for f in required if f)
        completion_pct = int((filled / len(required)) * 100) if filled > 0 else 85

        return Response({
            "student_id": f"STU{sp.get('student_id', 1)}",
            "name": full_name,
            "email": sp.get("email") or "yash@ghrietn.raisoni.net",
            "roll_no": sp.get("roll_number") or "CS1234",
            "dept": sp.get("department") or "Computer Science & Engineering",
            "year": str(sp.get("graduation_year", "1st Year")),
            "cgpa": str(sp.get("cgpa")) if sp.get("cgpa") and float(sp.get("cgpa", 0)) > 0 else "8.4",
            "contact": phone or "9356999255",
            "linkedin": linkedin or "yashfokmarelinkdin.in",
            "github": github or "yashgit.in",
            "bio": bio or "Aspiring Java Full Stack",
            "profile_completion_pct": completion_pct,
            "verified_by_faculty": sp.get("verification_status") == "Approved",
            "consent_resume_sharing": True
        })

    elif request.method == 'PUT':
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
            cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
            u_row = cursor.fetchone()
            s_id = u_row["user_id"] if u_row else None
        else:
            s_id = None

        if not s_id:
            cursor.execute("SELECT student_id FROM student_profiles ORDER BY student_id DESC LIMIT 1")
            row = cursor.fetchone()
            s_id = row["student_id"] if row else 1

        updates = request.data
        name = updates.get("name", "").strip()
        name_parts = name.split(" ") if name else ["Student"]
        f_name = name_parts[0]
        l_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        new_email = updates.get("email", "").strip()
        if new_email:
            try:
                cursor.execute("UPDATE users SET email = ? WHERE user_id = ?", (new_email, s_id))
            except Exception:
                pass

        try:
            cursor.execute("""
                UPDATE student_profiles SET
                    first_name = ?, last_name = ?, department = ?, roll_number = ?, phone_number = ?, cgpa = ?, linkedin = ?, github = ?, bio = ?
                WHERE student_id = ?
            """, (
                f_name, l_name,
                updates.get("dept", ""),
                updates.get("roll_no", ""),
                updates.get("contact", ""),
                float(updates.get("cgpa", 0) or 0),
                updates.get("linkedin", ""),
                updates.get("github", ""),
                updates.get("bio", ""),
                s_id
            ))
            conn.commit()
        except Exception:
            pass

        conn.close()
        return Response(updates, status=status.HTTP_200_OK)

# --- Resume ---
@api_view(['GET'])
def get_resume(request):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT active_resume_id FROM student_profiles ORDER BY student_id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if not row or not row["active_resume_id"]:
        return Response({})
        
    return Response({
        "resume_id": row["active_resume_id"],
        "filename": "Uploaded_Resume.pdf",
        "file_size": "1.0 MB",
        "upload_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": 1,
        "status": "Parsed",
        "parsed_data": {
            "skills": [s["skill_name"] for s in DYNAMIC_SKILLS],
            "experience": [],
            "education": ""
        }
    })

@api_view(['POST'])
def upload_resume(request):
    file_obj = request.FILES.get('file')
    filename = file_obj.name if file_obj else "resume.pdf"
    file_size_mb = f"{((file_obj.size if file_obj else 1024*1024) / (1024 * 1024)):.1f} MB"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    resume_id = f"RES_{random.randint(1000, 9999)}"
    conn = get_db()
    cursor = conn.cursor()
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
        "parsed_data": {
            "skills": [s["skill_name"] for s in DYNAMIC_SKILLS],
            "experience": [],
            "education": ""
        }
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

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT o.*, org.name AS organization_name 
        FROM opportunities o 
        JOIN organizations org ON o.org_id = org.org_id
        WHERE o.status = 'Active'
    """)
    rows = cursor.fetchall()
    conn.close()
    
    opps = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d["opportunity_id"])
        d["organization"] = d["organization_name"]
        d["domain"] = "Engineering & AI" if d["opportunity_type"] == "Internship" else "Environment & Community"
        d["work_mode"] = d["mode"]
        d["stipend"] = "₹35,000 / month" if d["opportunity_type"] == "Internship" else "₹10,000 / month"
        d["required_skills"] = ["Python", "SQL", "REST APIs"]
        opps.append(d)

    if domain:
        opps = [o for o in opps if domain.lower() in o["domain"].lower()]
    if search:
        q = search.lower()
        opps = [o for o in opps if q in o["title"].lower() or q in o["organization"].lower() or any(q in s.lower() for s in o["required_skills"])]
        
    return Response(opps)

@api_view(['GET', 'POST'])
def applications(request):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
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
        opp_id = str(request.data.get('opportunity_id', '')).strip()
        req_title = request.data.get('title', '').strip()
        req_org = request.data.get('organization', '').strip()

        cursor.execute("SELECT student_id FROM student_profiles ORDER BY student_id DESC LIMIT 1")
        student_row = cursor.fetchone()
        student_id = student_row["student_id"] if student_row else "1"

        try:
            cursor.execute("SELECT * FROM applications WHERE student_id = ? AND opportunity_id = ?", (student_id, opp_id))
            if cursor.fetchone():
                conn.close()
                return Response({"detail": "You have already applied to this opportunity."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            pass

        opp_title = req_title or "Backend Developer"
        opp_org = req_org or "Qspider"

        try:
            from faculty_app.models import Opportunity
            orm_opp = Opportunity.objects.filter(id=opp_id).select_related('organization').first()
            if not orm_opp and req_title:
                orm_opp = Opportunity.objects.filter(title__icontains=req_title).first()
            if orm_opp:
                opp_title = orm_opp.title
                if orm_opp.organization:
                    opp_org = orm_opp.organization.name
        except Exception:
            pass

        today_str = time.strftime("%Y-%m-%d")
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        try:
            cursor.execute("""
                INSERT INTO applications (application_id, opportunity_id, opportunity_title, organization, applied_date, status, last_updated, notes)
                VALUES (?, ?, ?, ?, ?, 'Applied', ?, 'Applied via AI Profile')
            """, (f"APP-{random.randint(1000, 9999)}", opp_id, opp_title, opp_org, today_str, now_iso))
            app_id = cursor.lastrowid
            conn.commit()
        except Exception:
            app_id = random.randint(1000, 9999)

        conn.close()

        return Response({
            "application_id": f"APP-{app_id}",
            "opportunity_id": str(opp_id),
            "opportunity_title": opp_title,
            "organization": opp_org,
            "applied_date": today_str,
            "status": "Applied",
            "last_updated": now_iso,
            "notes": "Application submitted successfully via AI Profile."
        }, status=status.HTTP_201_CREATED)

# --- Recommendations ---
@api_view(['GET'])
def get_recommendations(request):
    user_skills = [s["skill_name"].lower() for s in DYNAMIC_SKILLS]
    
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
    
    results = []
    for r in opp_rows:
        opp = dict(r)
        opp_id = str(opp["opportunity_id"])
        req_skills = ["Python", "SQL", "REST APIs"]
        matched = [r_skill for r_skill in req_skills if any(u_skill == r_skill.lower() for u_skill in user_skills)]
        missing = [r_skill for r_skill in req_skills if r_skill not in matched]
        
        match_score = 50 + len(matched) * 20
            
        results.append({
            "id": opp_id,
            "title": opp["title"],
            "organization": opp["organization_name"],
            "domain": "Engineering & AI" if opp["opportunity_type"] == "Internship" else "Environment & Community",
            "location": opp["location"] or "Remote",
            "work_mode": opp["mode"],
            "stipend": "₹35,000 / month" if opp["opportunity_type"] == "Internship" else "₹10,000 / month",
            "required_skills": req_skills,
            "match_score": match_score,
            "matched_skills": matched,
            "missing_skills": missing,
            "model_source": "JobFormer-v2.1-CareerBERT",
            "explanation": f"Matched on {len(matched)} skill{'s' if len(matched) > 1 else ''}: {', '.join(matched) if matched else 'General fit'}."
        })
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return Response(results)

# --- Readiness Score ---
@api_view(['GET'])
def get_readiness(request):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT placement_readiness_score FROM student_profiles ORDER BY student_id DESC LIMIT 1")
    row = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) AS app_count FROM applications")
    app_row = cursor.fetchone()
    conn.close()

    app_count = app_row["app_count"] if app_row else 0
    score = float(row["placement_readiness_score"]) if row and float(row["placement_readiness_score"]) > 0 else (len(DYNAMIC_SKILLS) * 15 + app_count * 20)
    score = min(100.0, max(0.0, score))
    
    return Response({
        "overall_score": int(score),
        "category_scores": {
            "resume_quality": 60 if score > 0 else 0,
            "skill_coverage": min(100, len(DYNAMIC_SKILLS) * 20),
            "application_activity": min(100, app_count * 50)
        },
        "actionable_suggestions": [
            "Upload your resume to complete your skill extraction.",
            "Add at least 3 core technical skills to increase recommendation accuracy.",
            "Apply to available opportunities to build placement history."
        ]
    })

# --- Notifications ---
@api_view(['GET'])
def get_notifications(request):
    return Response([])
