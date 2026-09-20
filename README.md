# 🎓 SAIOTAF: Semantic-Aware Intelligent Opportunity & Talent Alignment Framework

> **A Next-Generation AI-Powered Academic Placement, Accreditation, and Opportunity Matching Platform**  
> Designed for Engineering Institutions, University Placement Cells (T&P), Accreditation Audits (NAAC/NIRF), and Students.

---

## ⚡ Zero-Config Quick Start (1-Click Local Run)

### 📋 Prerequisites (Install once)
1. **Python (3.10, 3.11, 3.12, or 3.13)**: [Download Python](https://www.python.org/downloads/)  
   *(⚠️ **Crucial**: Check the box **"Add python.exe to PATH"** during setup).*
2. **Node.js (LTS Version 18, 20, or latest)**: [Download Node.js](https://nodejs.org/)

---

### 🚀 Running on Windows (1-Click)
1. Extract or clone this repository to your laptop.
2. **Double-click `run_project.bat`** *(or run `.\run_project.bat` in VS Code Terminal)*.
3. The script will automatically:
   - Verify Python and Node.js.
   - Install all required Python & React dependencies.
   - Initialize the database with sample profiles, opportunities, and faculty accounts.
   - Start the Django REST Backend (Port `8000`) and React Frontend (Port `5173`).
   - Automatically open your web browser to **`http://localhost:5173`**.

---

### 🍎 Running on macOS / Linux
Open your terminal in the project directory and run:
```bash
chmod +x run_project.sh
./run_project.sh
```

---

## 🔑 Default Test Credentials & Portal Accounts

The platform includes pre-seeded roles for immediate evaluation:

| Portal Tier | Web Route | Login Identifier / Email | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Student Portal** | `http://localhost:5173/` | `student@raisoni.net` | `password123` | AI Opportunity Matching, Resume Parsing, Verified Certificate Downloads, Application Tracker |
| **Faculty / T&P Portal** | `http://localhost:5173/faculty/login` | `omi` *(or `FAC101`)* | `password123` | Student Verification, Institutional Certificate Issuance, Real-time Applications Stream, NAAC/NIRF Analytics Export |
| **Super Admin Console** | `http://localhost:5173/login/admin` | `admin@saiotaf.edu` | `password123` | Cross-Tier Role Management, Telemetry Metrics, System-wide Overrides, RBAC Governance |

*Note: You can also click **"Register Account"** on the student portal to create new accounts on the fly.*

---

## 🗄️ Database Flexibility (Zero-Config SQLite & MySQL)

SAIOTAF features an **intelligent dual-mode database engine**:

- **Default Plug-and-Play Mode (SQLite)**:  
  No database installation required! If MySQL is not running on your computer, the backend **automatically falls back to the embedded pre-seeded SQLite database (`db.sqlite3`)**. Everything works 100% out of the box with zero setup.

- **Enterprise Mode (MySQL `saiotaf_db`)**:  
  If you have MySQL running on `localhost:3306`, the platform seamlessly connects to MySQL. (Configuration can be adjusted in `.env`).

---

## ⚙️ Environment Configuration (`.env.example`)

If you wish to customize port bindings or database passwords, copy `.env.example` to `.env`:

```ini
DEBUG=True
SECRET_KEY=saiotaf_super_secure_production_secret_key_2026_jwt_auth_django
USE_SQLITE=True

# Optional MySQL Settings
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=saiotaf_db
MYSQL_USER=root
MYSQL_PASSWORD=root
```

---

## 🛠️ Manual Developer Commands (Optional)

If you prefer running commands manually inside VS Code:

### Terminal 1 — Backend (Django REST Framework):
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate --run-syncdb
python manage.py runserver 8000
```
*API Base: `http://127.0.0.1:8000/api`*

### Terminal 2 — Frontend (React 19 + Vite):
```bash
# In the project root or student-dashboard folder:
npm install --legacy-peer-deps
npm run dev
```
*Web App: `http://localhost:5173`*

---

## 🏛️ System Architecture

- **Frontend**: React 19, Vite, Recharts, Lucide React, Glassmorphism Design System (Light/Dark Theme Engine).
- **Backend**: Python 3.10–3.13, Django 5.x, Django REST Framework, JWT Authentication, ReportLab PDF Engine.
- **Accreditation Ready**: Dynamic live funnel computation, NIRF/NAAC compliant reporting, cryptographic institutional seal certificates.
