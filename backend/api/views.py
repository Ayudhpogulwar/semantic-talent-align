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
            "verified_by_faculty": sp["verification_status"] == "Approved",
            "consent_resume_sharing": True
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
        opp_id = request.data.get('opportunity_id')
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
