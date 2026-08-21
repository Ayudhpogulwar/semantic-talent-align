# SAIOTAF — Team Collaboration & Integration Guide
## Shared MySQL Database (`saiotaf_db`) & System Integration Contract

> **Target Audience**: All Project Teammates (Student Dashboard Lead, Faculty/Moderator Dashboard Lead, Backend & AI Developers)

---

## 1. Unified MySQL Database (`saiotaf_db`)

All team members must connect their backend modules to the exact same MySQL database instance and schema:

* **Database Name**: `saiotaf_db`
* **MySQL Engine**: InnoDB (MySQL 8.0+)
* **Character Set**: `utf8mb4_unicode_ci`
* **DDL / Seed Script**: [`student-dashboard/backend/schema.sql`](file:///c:/Users/ayudh/OneDrive/AI/STUFAC/student-dashboard/backend/schema.sql)

---

## 2. Table Ownership & Module Responsibility Matrix

| Table Name | Primary Module Owner | Description & Operations |
| :--- | :--- | :--- |
| `users` | **Shared Authentication** | Core login identity, roles (`Student`, `Faculty`, `Admin`, `Organization`), hashed passwords, MFA status. |
| `student_profiles` | **Student Dashboard** | Read/Update by Student; Read & Status Verification (`Approved`/`Rejected`) by Faculty. |
| `faculty_profiles` | **Faculty Dashboard** | Department & designation info, administrative capability permissions (`role_permissions`). |
| `organizations` | **Faculty Dashboard** | Corporate & NGO partners registered. Verified by Faculty (`verified_by`). |
| `opportunities` | **Faculty / Student Shared** | Created & Approved by Faculty (`status = 'Active'`); Browsed & Applied by Students. |
| `internships` | **Faculty / Student Shared** | Specialized extension storing stipend, duration, PPO eligibility, and min CGPA requirement. |
| `ngo_opportunities` | **Faculty / Student Shared** | Specialized extension storing cause area, volunteer status, duration in weeks, impact notes. |
| `applications` | **Shared State Machine** | Created by Student (`Applied`); Updated by Faculty (`Under_Review` -> `Shortlisted` -> `Interview` -> `Offered`). |
| `application_status_history` | **Faculty Dashboard** | Audit logging of every status transition triggered by T&PO Officers. |
| `certificates` | **Faculty / Student Shared** | Uploaded by Student; Verified or Rejected by Faculty (`verified_by`, `verified_at`). |
| `audit_logs` | **System / Admin** | Security & verification activity logs across the entire framework. |

---

## 3. How Teammates Integrate with Your Student Dashboard

### A. How Faculty Team Member Connects:
1. Import [`student-dashboard/backend/schema.sql`](file:///c:/Users/ayudh/OneDrive/AI/STUFAC/student-dashboard/backend/schema.sql) into local MySQL (`CREATE DATABASE saiotaf_db`).
2. When a Faculty T&PO Officer updates a student's verification status in `student_profiles`:
   ```sql
   UPDATE student_profiles 
   SET verification_status = 'Approved', placement_readiness_score = 88.50 
   WHERE student_id = 1;
   ```
   *The Student Dashboard will instantly display the green `Approved` badge and updated score.*

3. When a Faculty Officer creates a new opportunity posting in `opportunities`:
   ```sql
   INSERT INTO opportunities (org_id, title, description, opportunity_type, mode, location, deadline, status, created_by)
   VALUES (1, 'Frontend Engineer Intern', 'React.js & CSS position', 'Internship', 'Remote', 'Remote', '2026-09-30 23:59:59', 'Active', 3);
   ```
   *The new position will automatically appear on the Student Dashboard under Opportunities & AI Matches.*

4. When a Faculty Officer updates an application status in `applications`:
   ```sql
   UPDATE applications 
   SET current_status = 'Shortlisted' 
   WHERE application_id = 1;

   INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by, remarks)
   VALUES (1, 'Under_Review', 'Shortlisted', 3, 'Shortlisted based on 92% AI Match score.');
   ```
   *The Student Application Tracker will immediately move the application step to "Shortlisted".*

---

## 4. Frontend Integration Contract

* **Design System Guide**: Share [`FRONTEND_DESIGN_SYSTEM_THEME.md`](file:///c:/Users/ayudh/OneDrive/AI/STUFAC/FRONTEND_DESIGN_SYSTEM_THEME.md) with your team member.
* Both dashboards will share:
  * Same Light/Dark contrast theme tokens.
  * Same typography (*Space Grotesk* + *Plus Jakarta Sans*).
  * Same glassmorphism panel styles (`.glass-panel`).
  * Same `lucide-react` icons.

---

## 5. Next Steps for You and Your Team

1. **Share Documents with Team**:
   - Send `schema.sql` (Database definition)
   - Send `FRONTEND_DESIGN_SYSTEM_THEME.md` (UI style guide)
   - Send `TEAM_INTEGRATION_GUIDE.md` (Integration contract)

2. **Backend Co-existence**:
   - Your Django backend serves `/api/profile`, `/api/opportunities`, `/api/applications` for students.
   - Your team member's backend (Django or FastAPI) can serve `/api/faculty/...` queries against the exact same `saiotaf_db` database.
