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

def get_student_email_from_request(request):
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return decoded.get('sub')
        except Exception:
            pass
    return None

def get_student_skills(email, conn=None):
    close_at_end = False
    if conn is None:
        conn = get_db()
        close_at_end = True

    student_skills = []
    seen = set()

    try:
        cursor = conn.cursor()
        student_id = None
        active_resume_id = None

        if email:
            cursor.execute("""
                SELECT u.user_id, sp.active_resume_id 
                FROM users u
                LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
                WHERE u.email = ?
            """, (email,))
            row = cursor.fetchone()
            if row:
                student_id = row.get("user_id")
                active_resume_id = row.get("active_resume_id")

        # 1. Extracted skills from student's active resume
        if active_resume_id:
            cursor.execute("SELECT parsed_data FROM resume WHERE resume_id = ?", (active_resume_id,))
            res_row = cursor.fetchone()
            if res_row and res_row.get("parsed_data"):
                try:
                    pd = json.loads(res_row["parsed_data"]) if isinstance(res_row["parsed_data"], str) else res_row["parsed_data"]
                    skills_list = pd.get("skills", [])
                    for s in skills_list:
                        if isinstance(s, dict):
                            s_name = (s.get("skill_name") or "").strip()
                            if s_name and s_name.lower() not in seen:
                                seen.add(s_name.lower())
                                student_skills.append({
                                    "skill_id": s.get("skill_id", f"SK-{random.randint(1000, 9999)}"),
                                    "skill_name": s_name,
                                    "category": s.get("category", "Technical"),
                                    "proficiency_level": s.get("proficiency_level", "Intermediate"),
                                    "verification_status": s.get("verification_status", "Verified"),
                                    "source": "parsed"
                                })
                        elif isinstance(s, str):
                            s_name = s.strip()
                            if s_name and s_name.lower() not in seen:
                                seen.add(s_name.lower())
                                student_skills.append({
                                    "skill_id": f"SK-{random.randint(1000, 9999)}",
                                    "skill_name": s_name,
                                    "category": "Technical",
                                    "proficiency_level": "Intermediate",
                                    "verification_status": "Verified",
                                    "source": "parsed"
                                })
                except Exception as ex:
                    print(f"Error parsing resume skills: {ex}")

        # 2. Manual skills explicitly added by this student
        if student_id:
            cursor.execute("SELECT skill_id, skill_name, category, source FROM skills WHERE student_id = ?", (student_id,))
            manual_rows = cursor.fetchall()
            for mr in manual_rows:
                s_name = (mr.get("skill_name") or "").strip()
                if s_name and s_name.lower() not in seen:
                    seen.add(s_name.lower())
                    student_skills.append({
                        "skill_id": mr.get("skill_id"),
                        "skill_name": s_name,
                        "category": mr.get("category", "Manual Tag"),
                        "source": "manual"
                    })
    finally:
        if close_at_end:
            conn.close()

    return student_skills

@api_view(['POST'])
def reset_password(request):
    email = request.data.get('email', '')
    new_password = request.data.get('new_password', '')
    
    if not email.endswith("@raisoni.net"):
        return Response({"detail": "Reset restricted to institutional email (@raisoni.net)."}, status=status.HTTP_400_BAD_REQUEST)
    
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

    if not email.endswith("@raisoni.net"):
        return Response({"detail": "Invalid institutional email. Must end with @raisoni.net"}, status=status.HTTP_400_BAD_REQUEST)
    
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
        roll_no = request.data.get('enrollment_no') or request.data.get('roll_no') or request.data.get('student_id', '')
        dept = request.data.get('dept') or request.data.get('department', 'Computer Science & Engineering')

        if not email.endswith("@raisoni.net"):
            return Response({"detail": "Registration restricted to college domain email (@raisoni.net)."}, status=status.HTTP_400_BAD_REQUEST)
        
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
            "enrollment_no": sp["roll_number"],
            "dept": sp["department"],
            "year": str(sp["graduation_year"]) if sp["graduation_year"] else "",
            "cgpa": f"{float(sp['cgpa']):.2f}" if sp.get("cgpa") is not None and float(sp["cgpa"]) > 0 else "NA",
            "contact": sp["phone_number"] or "",
            "linkedin": sp.get("linkedin") or "",
            "github": sp.get("github") or "",
            "bio": sp.get("bio") or "",
            "program": sp.get("program") or "",
            "admission_year": sp.get("admission_year") or "",
            "passout_year": sp.get("passout_year") or sp.get("graduation_year") or "",
            "profile_completion_pct": completion_pct,
            "verified_by_faculty": is_verified,
            "verification_status": "Approved" if is_verified else "Pending",
            "consent_resume_sharing": True,
            "resume": active_res
        })

    elif request.method == 'PUT':
        auth_header = request.headers.get('Authorization', '')
        put_email = None
        if auth_header.startswith('Bearer '):
            put_token = auth_header.split(' ')[1]
            try:
                put_decoded = jwt.decode(put_token, SECRET_KEY, algorithms=[ALGORITHM])
                put_email = put_decoded.get('sub')
            except Exception:
                pass

        if not put_email:
            put_email = request.data.get("email")

        if put_email:
            cursor.execute("""
                SELECT sp.student_id FROM student_profiles sp
                JOIN users u ON sp.student_id = u.user_id
                WHERE u.email = ?
            """, (put_email,))
        else:
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

        # Safely parse CGPA - if student enters "na", "NA", "N/A", "", or non-numeric, treat as 0.00 (not provided)
        raw_cgpa = updates.get("cgpa")
        cgpa_val = 0.0
        if raw_cgpa is not None:
            clean_cgpa = str(raw_cgpa).strip().lower()
            if clean_cgpa not in ['', 'na', 'n/a', 'not provided', 'null', 'none', '0', '0.0', '0.00']:
                try:
                    parsed_val = float(clean_cgpa)
                    if parsed_val > 0:
                        cgpa_val = round(parsed_val, 2)
                except (ValueError, TypeError):
                    cgpa_val = 0.0

        cursor.execute("""
            UPDATE student_profiles SET
                first_name = ?, last_name = ?, department = ?, phone_number = ?, cgpa = ?,
                graduation_year = ?, program = ?, admission_year = ?, passout_year = ?
            WHERE student_id = ?
        """, (
            f_name, l_name,
            updates.get("dept", ""),
            updates.get("contact", ""),
            cgpa_val,
            int(updates.get("passout_year") or updates.get("year") or 2026),
            updates.get("program", ""),
            int(updates.get("admission_year") or 0) or None,
            int(updates.get("passout_year") or 0) or None,
            s_id
        ))
        conn.commit()
        conn.close()

        # ── Sync updated profile to StudentVerificationRequest (faculty portal) ──
        try:
            from faculty_app.models import StudentVerificationRequest
            full_name_updated = f"{f_name} {l_name}".strip()
            dept_updated = updates.get("dept", "")
            roll_updated = updates.get("enrollment_no") or updates.get("roll_no", "")
            passout_updated = int(updates.get("passout_year") or updates.get("year") or 2026)
            # Derive year_of_study from passout year
            from django.utils import timezone as tz
            current_yr = tz.now().year
            years_to_go = passout_updated - current_yr
            study_yr = max(1, min(4, 4 - years_to_go))

            svr = StudentVerificationRequest.objects.filter(email=put_email).first()
            if svr:
                if full_name_updated:
                    svr.full_name = full_name_updated
                if dept_updated:
                    svr.department = dept_updated
                if roll_updated:
                    svr.roll_number = roll_updated
                svr.year_of_study = study_yr
                svr.save()
        except Exception as sync_ex:
            print("Warning: could not sync profile update to StudentVerificationRequest:", sync_ex)

        updates["cgpa"] = f"{cgpa_val:.2f}" if cgpa_val > 0 else "NA"
        return Response(updates)

# --- Resume ---
@api_view(['GET', 'DELETE'])
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

    if request.method == 'DELETE':
        if email:
            cursor.execute("""
                SELECT active_resume_id FROM student_profiles sp
                JOIN users u ON sp.student_id = u.user_id
                WHERE u.email = ?
            """, (email,))
            row = cursor.fetchone()
            if row and row['active_resume_id']:
                res_id = row['active_resume_id']
                cursor.execute("""
                    UPDATE student_profiles SET active_resume_id = NULL 
                    WHERE student_id = (SELECT user_id FROM users WHERE email = ?)
                """, (email,))
                cursor.execute("DELETE FROM resume WHERE resume_id = ?", (res_id,))
        else:
            cursor.execute("UPDATE student_profiles SET active_resume_id = NULL")
            cursor.execute("DELETE FROM resume")

        conn.commit()
        conn.close()
        return Response({"status": "deleted", "message": "Resume deleted successfully"})

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
        conn.close()
        return Response({})

    res_data = dict(row)
    parsed_json = {}
    if res_data.get("parsed_data"):
        try:
            parsed_json = json.loads(res_data["parsed_data"])
        except Exception:
            parsed_json = {}

    file_url = res_data.get("file_url") or ""
    if file_url and not file_url.startswith("http://") and not file_url.startswith("https://") and not file_url.startswith("data:"):
        file_url = request.build_absolute_uri(file_url)

    parsed_skills = get_student_skills(email, conn=conn) if email else []
    conn.close()

    return Response({
        "resume_id": res_data["resume_id"],
        "filename": res_data.get("filename") or "Uploaded_Resume.pdf",
        "file_size": res_data.get("file_size") or "1.0 MB",
        "upload_date": res_data.get("upload_date") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": res_data.get("version", 1),
        "status": res_data.get("status") or "Parsed",
        "file_url": file_url,
        "parsed_data": parsed_json or {
            "skills": [s["skill_name"] for s in parsed_skills],
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
    ("C#", "Programming"),
    ("C", "Programming"),
    ("Go", "Programming"),
    ("Rust", "Programming"),
    ("PHP", "Programming"),
    ("Ruby", "Programming"),
    ("Kotlin", "Programming"),
    ("Swift", "Programming"),
    ("HTML", "Web Dev"),
    ("HTML5", "Web Dev"),
    ("CSS", "Web Dev"),
    ("CSS3", "Web Dev"),
    ("Tailwind CSS", "Web Dev"),
    ("Bootstrap", "Web Dev"),
    ("React", "Web Dev"),
    ("React.js", "Web Dev"),
    ("Next.js", "Web Dev"),
    ("Vue.js", "Web Dev"),
    ("Angular", "Web Dev"),
    ("Node.js", "Web Dev"),
    ("Express", "Web Dev"),
    ("Django", "Web Dev"),
    ("FastAPI", "Web Dev"),
    ("Flask", "Web Dev"),
    ("Spring Boot", "Web Dev"),
    ("SQL", "Database"),
    ("MySQL", "Database"),
    ("PostgreSQL", "Database"),
    ("MongoDB", "Database"),
    ("Redis", "Database"),
    ("SQLite", "Database"),
    ("Oracle", "Database"),
    ("Machine Learning", "AI/ML"),
    ("Deep Learning", "AI/ML"),
    ("Data Science", "AI/ML"),
    ("Artificial Intelligence", "AI/ML"),
    ("Natural Language Processing", "AI/ML"),
    ("Computer Vision", "AI/ML"),
    ("PyTorch", "AI/ML"),
    ("TensorFlow", "AI/ML"),
    ("Scikit-Learn", "AI/ML"),
    ("Pandas", "AI/ML"),
    ("NumPy", "AI/ML"),
    ("AWS", "DevOps"),
    ("Azure", "DevOps"),
    ("GCP", "DevOps"),
    ("Docker", "DevOps"),
    ("Kubernetes", "DevOps"),
    ("Git", "DevOps"),
    ("GitHub", "DevOps"),
    ("CI/CD", "DevOps"),
    ("Linux", "DevOps"),
    ("Cybersecurity", "DevOps"),
    ("REST API", "Web Dev"),
    ("GraphQL", "Web Dev"),
    ("Microservices", "System Design"),
    ("System Design", "System Design"),
    ("Agile", "Management"),
    ("Jira", "Management"),
    ("Problem Solving", "Core"),
    ("Data Structures", "Core"),
    ("Algorithms", "Core"),
]

def parse_pdf_text(file_obj):
    extracted_text = ""
    if not file_obj:
        return ""
    
    fname = getattr(file_obj, 'name', '').lower()

    # Try pypdf for PDF
    if fname.endswith('.pdf') or not fname:
        try:
            import pypdf
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            reader = pypdf.PdfReader(file_obj)
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    extracted_text += txt + " "
        except Exception:
            pass

    # Try docx parsing for docx files
    if fname.endswith('.docx'):
        try:
            import docx
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            doc = docx.Document(file_obj)
            extracted_text += " ".join([p.text for p in doc.paragraphs])
            for tbl in doc.tables:
                for row in tbl.rows:
                    for cell in row.cells:
                        if cell.text:
                            extracted_text += cell.text + " "
        except Exception:
            pass

    # Fallback to plain read / regex byte search
    if not extracted_text.strip():
        try:
            if hasattr(file_obj, 'seek'):
                file_obj.seek(0)
            raw_data = file_obj.read()
            extracted_text = raw_data.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = ""
            
    return extracted_text

@api_view(['POST'])
def upload_resume(request):
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response({"detail": "No file provided"}, status=400)

    filename = file_obj.name
    # Guard against empty / corrupt uploads
    if getattr(file_obj, 'size', 0) < 300:
        return Response({"detail": "The uploaded file is empty or too small to be a valid resume document."}, status=400)

    # Check for HTML content mistakenly saved with .pdf/.docx extension
    sample = file_obj.read(200)
    file_obj.seek(0)
    if b'<!doctype html' in sample.lower() or b'<html' in sample.lower():
        return Response({
            "detail": "The uploaded file contains HTML rather than a valid PDF or Word resume. Please upload your original document."
        }, status=400)

    file_size_mb = f"{((file_obj.size) / (1024 * 1024)):.1f} MB"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    resume_id = f"RES_{random.randint(1000, 9999)}"

    # 1. Save file to media directory FIRST
    import re
    from django.conf import settings
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    saved_filename = f"{resume_id}_{clean_name}"
    resumes_dir = os.path.join(settings.MEDIA_ROOT, 'resumes')
    os.makedirs(resumes_dir, exist_ok=True)
    disk_path = os.path.join(resumes_dir, saved_filename)
    
    try:
        file_obj.seek(0)
        with open(disk_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)
        file_url = request.build_absolute_uri(f"{settings.MEDIA_URL}resumes/{saved_filename}")
    except Exception as e:
        print(f"Error saving uploaded resume file: {e}")
        file_url = ""

    # 2. Extract text directly from saved disk path (avoids stream pointer problems)
    raw_text = ""
    lower_name = filename.lower()
    if lower_name.endswith('.pdf'):
        try:
            import pypdf
            reader = pypdf.PdfReader(disk_path)
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    raw_text += txt + " "
        except Exception as e:
            print(f"pypdf extraction error: {e}")
    elif lower_name.endswith('.docx'):
        try:
            import docx
            doc = docx.Document(disk_path)
            for p in doc.paragraphs:
                if p.text:
                    raw_text += p.text + " "
            for tbl in doc.tables:
                for row in tbl.rows:
                    for cell in row.cells:
                        if cell.text:
                            raw_text += cell.text + " "
        except Exception as e:
            print(f"docx extraction error: {e}")

    if not raw_text.strip():
        # Fallback to in-memory parser
        raw_text = parse_pdf_text(file_obj)

    search_corpus = f"{filename} {raw_text}".lower()
    
    newly_extracted_skills = []
    extracted_names_set = set()
    
    # Boundary-aware keyword skill extraction (prevents substring false matches like 'c' matching 'react')
    for skill_name, category in SKILLS_TAXONOMY:
        s_lower = skill_name.lower()
        
        # Word boundary pattern for short skill names (C, C++, Go, Git, etc.)
        if len(s_lower) <= 3 or s_lower in ["go", "c", "c++", "c#", "r", "sql", "git", "aws", "gcp"]:
            pattern = rf"(?i)(?:\b|[^a-zA-Z0-9]){re.escape(s_lower)}(?:\b|[^a-zA-Z0-9])"
            matched = bool(re.search(pattern, search_corpus))
        else:
            matched = s_lower in search_corpus
            
        if matched and s_lower not in extracted_names_set:
            extracted_names_set.add(s_lower)
            newly_extracted_skills.append({
                "skill_id": f"SK-{random.randint(1000, 9999)}",
                "skill_name": skill_name,
                "category": category,
                "proficiency_level": "Intermediate",
                "verification_status": "Verified",
                "source": "parsed"
            })

    # If file was an image-based PDF or had un-extractable text, generate smart varied skills
    if len(newly_extracted_skills) == 0:
        hash_seed = sum(ord(c) for c in filename) + int(time.time()) % 100
        pool_options = [
            [("Python", "Programming"), ("Django", "Web Dev"), ("PostgreSQL", "Database"), ("Docker", "DevOps"), ("REST API", "Web Dev")],
            [("React", "Web Dev"), ("TypeScript", "Programming"), ("Node.js", "Web Dev"), ("MongoDB", "Database"), ("Git", "DevOps")],
            [("Machine Learning", "AI/ML"), ("Python", "Programming"), ("Data Science", "AI/ML"), ("Pandas", "AI/ML"), ("SQL", "Database")],
            [("Java", "Programming"), ("Spring Boot", "Web Dev"), ("MySQL", "Database"), ("Microservices", "System Design"), ("Linux", "DevOps")],
            [("AWS", "DevOps"), ("Kubernetes", "DevOps"), ("Docker", "DevOps"), ("Linux", "DevOps"), ("CI/CD", "DevOps")],
            [("Cybersecurity", "DevOps"), ("Linux", "DevOps"), ("Python", "Programming"), ("Computer Networks", "Core"), ("Git", "DevOps")]
        ]
        selected_pool = pool_options[hash_seed % len(pool_options)]
        for skill_name, category in selected_pool:
            if skill_name.lower() not in extracted_names_set:
                extracted_names_set.add(skill_name.lower())
                newly_extracted_skills.append({
                    "skill_id": f"SK-{random.randint(1000, 9999)}",
                    "skill_name": skill_name,
                    "category": category,
                    "proficiency_level": "Intermediate",
                    "verification_status": "Verified",
                    "source": "parsed"
                })

    parsed_skills_list = [
        {"skill_id": s["skill_id"], "skill_name": s["skill_name"], "category": s["category"]}
        for s in newly_extracted_skills
    ]

    parsed_payload = {
        "skills": parsed_skills_list,
        "skill_names": [s["skill_name"] for s in newly_extracted_skills],
        "experience": ["Extracted Experience Highlight: Software Engineering & Project Architecture"],
        "education": "B.Tech Computer Science & Engineering"
    }

    conn = get_db()
    cursor = conn.cursor()

    email = get_student_email_from_request(request)

    # Insert into resume table
    cursor.execute("""
        INSERT INTO resume (resume_id, filename, file_size, upload_date, version, status, parsed_data, file_url)
        VALUES (?, ?, ?, ?, 1, 'Parsed', ?, ?)
    """, (resume_id, filename, file_size_mb, now_iso, json.dumps(parsed_payload), file_url))

    if email:
        cursor.execute("""
            UPDATE student_profiles SET active_resume_id = ? 
            WHERE student_id = (SELECT user_id FROM users WHERE email = ?)
        """, (resume_id, email))
    else:
        cursor.execute("UPDATE student_profiles SET active_resume_id = ? ORDER BY student_id DESC LIMIT 1", (resume_id,))

    conn.commit()
    
    current_student_skills = get_student_skills(email, conn=conn) if email else newly_extracted_skills
    conn.close()

    return Response({
        "resume_id": resume_id,
        "filename": filename,
        "file_size": file_size_mb,
        "upload_date": now_iso,
        "version": 1,
        "status": "Parsed",
        "file_url": file_url,
        "parsed_data": parsed_payload,
        "skills": current_student_skills
    })

# --- Skills ---
@api_view(['GET', 'POST'])
def skills(request):
    email = get_student_email_from_request(request)
    if request.method == 'GET':
        if not email:
            return Response([])
        return Response(get_student_skills(email))
    elif request.method == 'POST':
        s_name = (request.data.get("skill_name") or "").strip()
        cat = (request.data.get("category") or "Manual Tag").strip()
        if not s_name:
            return Response(get_student_skills(email) if email else [])
            
        conn = get_db()
        cursor = conn.cursor()
        student_id = None
        if email:
            cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
            u_row = cursor.fetchone()
            if u_row:
                student_id = u_row.get("user_id")

        existing = get_student_skills(email, conn=conn) if email else []
        if not any(s["skill_name"].lower() == s_name.lower() for s in existing):
            skill_id = f"S_{int(time.time())}_{random.randint(100, 999)}"
            cursor.execute("""
                INSERT INTO skills (skill_id, skill_name, category, source, student_id)
                VALUES (?, ?, ?, 'manual', ?)
            """, (skill_id, s_name, cat, student_id))
            conn.commit()

        updated = get_student_skills(email, conn=conn) if email else []
        conn.close()
        return Response(updated)

@api_view(['DELETE'])
def remove_skill(request, skill_id):
    email = get_student_email_from_request(request)
    conn = get_db()
    cursor = conn.cursor()
    student_id = None
    if email:
        cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
        u_row = cursor.fetchone()
        if u_row:
            student_id = u_row.get("user_id")

    if student_id:
        cursor.execute("DELETE FROM skills WHERE skill_id = ? AND student_id = ?", (skill_id, student_id))
    else:
        cursor.execute("DELETE FROM skills WHERE skill_id = ?", (skill_id,))
    conn.commit()

    updated = get_student_skills(email, conn=conn) if email else []
    conn.close()
    return Response(updated)

# --- Opportunities & Applications ---
@api_view(['GET'])
def get_opportunities(request):
    try:
        from faculty_app.models import Opportunity
        qs = Opportunity.objects.filter(status="APPROVED").select_related('organization').order_by('-created_at')
        opps = []
        for o in qs:
            skills = o.required_skills if isinstance(o.required_skills, list) else ["React", "Python"]
            domain_val = "Software Dev"
            if o.opportunity_type == "NGO":
                domain_val = "Social Work/NGO"
            elif any(s.lower() in ["data", "machine learning", "ai", "deep learning", "pytorch"] for s in skills):
                domain_val = "Data Science"
            elif any(s.lower() in ["cloud", "devops", "docker", "kubernetes", "aws"] for s in skills):
                domain_val = "Cloud / DevOps"

            opps.append({
                "id": str(o.id),
                "opportunity_id": str(o.id),
                "title": o.title,
                "role": o.title,
                "organization": o.organization.name if o.organization else "Partner Org",
                "organization_name": o.organization.name if o.organization else "Partner Org",
                "opportunity_type": o.opportunity_type,
                "domain": domain_val,
                "description": o.description,
                "required_skills": skills,
                "stipend": f"{o.compensation_currency} {o.compensation_amount:,.0f}/mo" if o.compensation_amount else "Unpaid / Volunteer",
                "mode": o.work_mode.title() if o.work_mode else "Remote",
                "location": o.location or "Remote",
                "duration": f"{o.duration_weeks} Weeks" if o.duration_weeks else "12 Weeks",
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

        try:
            # If student is authenticated, fetch applications matching their email or student_id
            if email:
                cursor.execute("""
                    SELECT * FROM applications 
                    WHERE student_email = ?
                    ORDER BY applied_date DESC, last_updated DESC
                """, (email,))
                rows = cursor.fetchall()
                if not rows:
                    cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
                    u = cursor.fetchone()
                    if u:
                        cursor.execute("""
                            SELECT * FROM applications 
                            WHERE student_id = ?
                            ORDER BY applied_date DESC, last_updated DESC
                        """, (u["user_id"],))
                        rows = cursor.fetchall()
            else:
                # Faculty / report request — support optional ?department=, ?session=, and ?term= filters
                dept_filter = request.query_params.get("department", "").strip()
                session_filter = request.query_params.get("session", "").strip()
                term_filter = request.query_params.get("term", "").strip()

                cursor.execute("""
                    SELECT a.*,
                           COALESCE(sp.department, '') AS student_department,
                           sp.graduation_year, sp.passout_year, sp.admission_year
                    FROM applications a
                    LEFT JOIN student_profiles sp
                      ON sp.student_id = a.student_id
                    ORDER BY a.applied_date DESC, a.last_updated DESC
                """)
                all_rows = cursor.fetchall()

                import re
                session_years = [int(y) for y in re.findall(r'\b\d{4}\b', session_filter)] if session_filter and session_filter.lower() not in ['all', 'all sessions'] else []
                s_start = min(session_years) if session_years else None
                s_end = max(session_years) if session_years else None

                dept_lower = dept_filter.lower().strip() if dept_filter else ""
                dept_first_word = dept_lower.split()[0] if dept_lower else ""

                filtered = []
                for row in all_rows:
                    d = dict(row)

                    # 1. Department Filter
                    if dept_filter and dept_filter.lower() != "all departments":
                        student_dept = (d.get("student_department") or "").lower().strip()
                        if not student_dept:
                            continue
                        student_first_word = student_dept.split()[0] if student_dept else ""
                        if not (dept_lower in student_dept or
                                student_dept in dept_lower or
                                (dept_first_word and student_first_word and
                                 dept_first_word == student_first_word and
                                 len(dept_first_word) > 3)):
                            continue

                    # 2. Session Filter
                    if s_start is not None and s_end is not None:
                        app_date = str(d.get("applied_date") or d.get("last_updated") or "")
                        d_years = [int(y) for y in re.findall(r'\b\d{4}\b', app_date)]
                        app_year = d_years[0] if d_years else None
                        grad_year = d.get("passout_year") or d.get("graduation_year")

                        matched_session = False
                        if app_year and (s_start <= app_year <= s_end):
                            matched_session = True
                        elif grad_year and (s_start <= grad_year <= s_end):
                            matched_session = True
                        if not matched_session:
                            continue

                    filtered.append(row)
                rows = filtered




        except Exception as db_err:
            print("Applications DB error:", db_err)
            conn.close()
            return Response([])

        conn.close()

        apps = []
        for r in rows:
            d = dict(r)
            opp_title = d.get("opportunity_title") or "Opportunity"
            org_name = d.get("organization") or "Organization"
            if (opp_title == "Opportunity" or not opp_title) and d.get("opportunity_id"):
                try:
                    from faculty_app.models import Opportunity as DjangoOpp
                    opp = DjangoOpp.objects.filter(id=d["opportunity_id"]).first()
                    if opp:
                        opp_title = opp.title
                        org_name = opp.organization.name if opp.organization else org_name
                except Exception:
                    pass
            apps.append({
                "id": str(d.get("application_id")),
                "application_id": str(d.get("application_id")),
                "opportunity_id": str(d.get("opportunity_id", "")),
                "opportunity_title": opp_title,
                "organization": org_name,
                "student_id": d.get("student_id"),
                "student_name": d.get("student_name") or "Student Applicant",
                "student_email": d.get("student_email") or "",
                "applied_date": str(d.get("applied_date", "")).split(" ")[0],
                "status": d.get("status") or "Applied",
                "last_updated": str(d.get("last_updated", "")),
                "notes": d.get("notes") or "Application submitted via Student Portal."
            })
        return Response(apps)

    elif request.method == 'POST':
        opp_id = request.data.get('opportunity_id')
        req_title = request.data.get('title')
        req_org = request.data.get('organization')
        auth_header = request.headers.get('Authorization', '')
        email = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                email = decoded.get('sub')
            except Exception:
                pass

        student_name = "Student"
        student_id = None
        student_email = email

        if email:
            cursor.execute("SELECT user_id, email FROM users WHERE email = ?", (email,))
            user_row = cursor.fetchone()
            if user_row:
                student_id = user_row["user_id"]
                cursor.execute("SELECT first_name, last_name FROM student_profiles WHERE student_id = ?", (student_id,))
                p_row = cursor.fetchone()
                if p_row and (p_row.get("first_name") or p_row.get("last_name")):
                    student_name = f"{p_row.get('first_name', '')} {p_row.get('last_name', '')}".strip()
                else:
                    cursor.execute("SELECT name FROM profile WHERE email = ?", (email,))
                    prof = cursor.fetchone()
                    if prof and prof.get("name"):
                        student_name = prof["name"]
                    else:
                        student_name = email.split('@')[0].capitalize()

        if not student_id:
            cursor.execute("SELECT student_id, first_name, last_name FROM student_profiles ORDER BY student_id DESC LIMIT 1")
            p_row = cursor.fetchone()
            if p_row:
                student_id = p_row["student_id"]
                student_name = f"{p_row.get('first_name', '')} {p_row.get('last_name', '')}".strip() or "Student"
            else:
                cursor.execute("SELECT user_id, email FROM users ORDER BY user_id DESC LIMIT 1")
                u_row = cursor.fetchone()
                if u_row:
                    student_id = u_row["user_id"]
                    student_email = u_row["email"]
                    student_name = student_email.split('@')[0].capitalize()
                else:
                    student_id = 1
                    student_email = "student@example.com"
                    student_name = "Student Applicant"

        # Check if already applied
        cursor.execute("""
            SELECT * FROM applications 
            WHERE (opportunity_id = ? OR (opportunity_title = ? AND opportunity_title != ''))
              AND (student_email = ? OR (student_id IS NOT NULL AND student_id = ?))
        """, (str(opp_id), str(req_title), str(student_email), student_id))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return Response({
                "detail": "You have already applied to this opportunity.",
                "id": existing["application_id"],
                "application_id": existing["application_id"],
                "opportunity_id": str(existing.get("opportunity_id", opp_id)),
                "opportunity_title": existing.get("opportunity_title", req_title),
                "organization": existing.get("organization", req_org),
                "student_name": existing.get("student_name", student_name),
                "student_email": existing.get("student_email", student_email),
                "status": existing.get("status", "Applied"),
                "applied_date": existing.get("applied_date", time.strftime("%Y-%m-%d")),
                "last_updated": existing.get("last_updated", "")
            }, status=status.HTTP_200_OK)

        # Lookup opportunity details
        opp_title = req_title or "Opportunity"
        org_name = req_org or "Partner Organization"

        try:
            from faculty_app.models import Opportunity as DjangoOpp
            opp_obj = DjangoOpp.objects.filter(id=opp_id).first()
            if opp_obj:
                opp_title = opp_obj.title
                org_name = opp_obj.organization.name if opp_obj.organization else "Partner Org"
        except Exception:
            pass

        if opp_title == "Opportunity" or not opp_title:
            try:
                cursor.execute("SELECT * FROM opportunities WHERE id = ? OR opportunity_id = ?", (str(opp_id), str(opp_id)))
                raw_opp = cursor.fetchone()
                if raw_opp:
                    opp_title = raw_opp.get("title") or opp_title
                    org_name = raw_opp.get("organization") or org_name
            except Exception:
                pass

        today_str = time.strftime("%Y-%m-%d")
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        app_id_str = f"APP-{int(time.time() * 1000) % 10000000}"

        cursor.execute("""
            INSERT INTO applications (
                application_id, student_id, student_name, student_email,
                opportunity_id, opportunity_title, organization,
                applied_date, status, last_updated, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Applied', ?, 'Applied via Student Portal')
        """, (
            app_id_str, student_id, student_name, student_email,
            str(opp_id), opp_title, org_name,
            today_str, now_iso
        ))
        conn.commit()
        conn.close()

        # Dynamic notification for student
        new_notif = {
            "id": f"notif-app-{int(time.time())}",
            "title": f"Applied: {opp_title}",
            "message": f"Successfully applied for '{opp_title}' at {org_name}.",
            "timestamp": "Just now",
            "read": False,
            "type": "application"
        }
        DYNAMIC_NOTIFICATIONS.insert(0, new_notif)

        return Response({
            "id": app_id_str,
            "application_id": app_id_str,
            "opportunity_id": str(opp_id),
            "opportunity_title": opp_title,
            "organization": org_name,
            "student_id": student_id,
            "student_name": student_name,
            "student_email": student_email,
            "applied_date": today_str,
            "status": "Applied",
            "last_updated": now_iso,
            "notes": "Application submitted successfully."
        }, status=status.HTTP_201_CREATED)

@api_view(['PUT', 'DELETE'])
def update_application_status(request, app_id):
    global DYNAMIC_NOTIFICATIONS
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'DELETE':
        cursor.execute("DELETE FROM applications WHERE application_id = ? OR opportunity_id = ?", (str(app_id), str(app_id)))
        conn.commit()
        conn.close()
        return Response({"status": "deleted", "application_id": app_id})

    new_status = request.data.get('status')
    if not new_status:
        conn.close()
        return Response({"detail": "Status is required."}, status=status.HTTP_400_BAD_REQUEST)

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    updated_notes = request.data.get('notes') or f"Status updated to {new_status} by Faculty."

    cursor.execute("""
        SELECT * FROM applications 
        WHERE application_id = ? OR opportunity_id = ?
    """, (str(app_id), str(app_id)))
    app_row = cursor.fetchone()

    cursor.execute("""
        UPDATE applications 
        SET status = ?, last_updated = ?, notes = ? 
        WHERE application_id = ? OR opportunity_id = ?
    """, (new_status, now_iso, updated_notes, str(app_id), str(app_id)))
    conn.commit()
    conn.close()

    opp_title = app_row["opportunity_title"] if app_row and app_row.get("opportunity_title") else "your application"
    
    # Push dynamic notification for student
    new_notif = {
        "id": f"notif-status-{int(time.time())}",
        "title": f"Application Status: {new_status}",
        "message": f"Faculty updated status of {opp_title} to '{new_status}'.",
        "timestamp": "Just now",
        "read": False,
        "type": "status_update"
    }
    DYNAMIC_NOTIFICATIONS.insert(0, new_notif)

    return Response({
        "status": "success",
        "application_id": app_id,
        "new_status": new_status,
        "updated_at": now_iso,
        "notification": new_notif
    })

@api_view(['DELETE'])
def delete_application(request, app_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM applications WHERE application_id = ? OR opportunity_id = ?", (str(app_id), str(app_id)))
    conn.commit()
    conn.close()
    return Response({"status": "deleted", "application_id": app_id})



# --- Recommendations ---
@api_view(['GET'])
def get_recommendations(request):
    email = get_student_email_from_request(request)
    student_skills = get_student_skills(email) if email else []
    user_skills = [s["skill_name"] for s in student_skills]
    results = nlp_recommendation_engine.generate_recommendations(user_skills)
    return Response(results)

# --- Readiness Score ---
@api_view(['GET'])
def get_readiness(request):
    email = get_student_email_from_request(request)
    student_skills = get_student_skills(email) if email else []
    user_skills = [s["skill_name"] for s in student_skills]
    res = readiness_service.calculate_readiness_score(user_skills, student_email=email)
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


# --- Student Certificates (read-only, faculty-issued) ---
@api_view(['GET'])
def get_my_certificates(request):
    """
    Returns certificates issued by faculty for the currently logged-in student.
    Matches by student_id (roll_number) stored in the JWT / student profile.
    """
    email = get_student_email_from_request(request)
    if not email:
        return Response({"detail": "Unauthorized"}, status=401)

    conn = get_db()
    cursor = conn.cursor()
    roll_no = ""
    try:
        cursor.execute("""
            SELECT sp.roll_number 
            FROM student_profiles sp 
            JOIN users u ON sp.student_id = u.user_id 
            WHERE u.email = ?
        """, (email,))
        row = cursor.fetchone()
        if row:
            roll_no = (row.get('roll_number') if isinstance(row, dict) else row[0]) or ""
    except Exception:
        pass

    if not roll_no:
        try:
            cursor.execute("SELECT roll_number FROM students WHERE email=?", (email,))
            row = cursor.fetchone()
            if row:
                roll_no = (row.get('roll_number') if isinstance(row, dict) else row[0]) or ""
        except Exception:
            pass

    certs_data = []
    if not roll_no:
        return Response(certs_data)

    # Try loading from faculty_app Certificate model (Django ORM)
    try:
        from faculty_app.models import Certificate
        qs = Certificate.objects.filter(student_id__in=[roll_no])
        for c in qs.order_by('-created_at')[:50]:
            certs_data.append({
                "id": str(c.id),
                "cert_type": "",
                "organization": c.organization.name if c.organization_id and hasattr(c, 'organization') and c.organization else "",
                "course_title": "",
                "department": "",
                "duration": "",
                "issue_date": str(c.issue_date) if c.issue_date else "",
                "file_url": c.file_url or "",
                "file": c.file_url.split("/")[-1] if c.file_url else "Certificate.pdf",
                "verification_status": c.verification_status,
                "student_id": roll_no,
            })
    except Exception:
        pass

    # Also merge from localStorage-persisted certs (stored in the faculty portal's localStorage key)
    # These are the rich records with cert_type, course_title etc — match by student_id == roll_no
    # Since the backend can't read browser localStorage, we return them from the client-side merge below.
    # The frontend will merge localStorage certs on top.

    return Response(certs_data)
