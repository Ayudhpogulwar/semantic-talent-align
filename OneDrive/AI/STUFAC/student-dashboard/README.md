# Semantic Opportunity Alignment - AI Student & Faculty Placement Portal

A Semantic-Aware Intelligent Opportunity & Talent Alignment Framework built with React.js, Python Django, spaCy NLP, and Sentence-BERT semantic similarity embedding matching.

---

## 🏗️ System Architecture

![System Architecture Framework](https://raw.githubusercontent.com/Ayudhpogulwar/semantic-talent-align/main/architecture.png)

```
+---------------------------------------------------------------------------------------------------+
| 1. DASHBOARDS                                                                                     |
|   - Student Dashboard: Login/Register, Profile Creation, Resume Upload, Skills Matrix,            |
|                        Applications Track, Placement Readiness Score                              |
|   - Faculty/Moderator: Secure Login, Verify Students, Opportunity Posting, Certificate            |
|                        Verification, Analytics & Reports                                          |
+---------------------------------------------------------------------------------------------------+
                                                  |
+---------------------------------------------------------------------------------------------------+
| 2. FRONTEND LAYER: React.js, HTML5, CSS3, Vanilla CSS Glassmorphism Design                        |
+---------------------------------------------------------------------------------------------------+
                                                  |
+---------------------------------------------------------------------------------------------------+
| 3. BACKEND LAYER: Python Django REST Framework                                                    |
|    - User Management -> Resume Management -> Opportunity Management -> Application Management      |
+---------------------------------------------------------------------------------------------------+
                                                  |
+---------------------------------------------------------------------------------------------------+
| 4. CENTERPIECE — SEMANTIC AI RECOMMENDATION ENGINE                                                 |
|    - Resume Upload -> Resume Parsing (spaCy) -> Skill Extraction -> Sentence-BERT Embedding       |
|    - Semantic Similarity Matching -> Placement Readiness Score -> Explainable AI Recommendation   |
+---------------------------------------------------------------------------------------------------+
                                                  |
+---------------------------------------------------------------------------------------------------+
| 5. DATABASE LAYER: SQLite / PostgreSQL ORM                                                        |
|    - Student Profiles | Faculty | Resume DB | Skills DB | Internships | NGO | Applications        |
+---------------------------------------------------------------------------------------------------+
                                                  |
+---------------------------------------------------------------------------------------------------+
| 6. OUTPUT LAYER                                                                                   |
|    1. Personalized Internships  2. NGO Recommendations  3. Resume Score  4. Skill Gap Report     |
|    5. Placement Readiness Score  6. Faculty Analytics & Reports                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 🌟 Core Functional Components

### 🎓 1. Student Dashboard
- **Login / Register**: Institutional email domain verification (`@college.edu`).
- **Profile Creation & Verification**: Automatic sync with Faculty Verification Queue.
- **Resume Upload & spaCy NLP Parsing**: Automatic PDF/DOCX skill vector extraction using `pypdf` & spaCy NLP keyword matching.
- **Embedded Live PDF Viewer**: In-browser document viewer modal with download controls.
- **Verified Skill Matrix**: Interactive skill tagging and proficiency score analysis.
- **Placement Readiness Score**: Real-time score calculator based on skills, profile completion, and resume quality.

### 🏛️ 2. Faculty / Moderator Dashboard
- **Secure Faculty Login**: Employee ID authentication (`EMP-101`, `EMP-102`, `EMP-103`).
- **Student Verification Queue**: Real-time verification queue to approve or reject student profiles.
- **Opportunity Management**: Post and manage Corporate Internships and NGO Volunteering opportunities.
- **Faculty Analytics**: System metrics on student readiness, placement pipeline, and verified skills.

### 🧠 3. Semantic AI Engine
- **Sentence-BERT Embedding**: Vector similarity embedding between student skill matrices and job descriptions.
- **Skill Gap Analysis**: Highlights missing core skills required for target opportunities.
- **Explainable Recommendations**: Detailed match percentage score breakdowns.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18+
- **Python**: v3.10+

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Ayudhpogulwar/semantic-talent-align.git
cd semantic-talent-align
```

---

### Step 2: Run the Frontend (Vite + React)
```bash
npm install
npm run dev
```
> Frontend running at **http://localhost:5173**

---

### Step 3: Run the Backend (Django REST Framework)
Open a new terminal window:
```bash
cd backend
pip install django djangorestframework django-cors-headers pypdf whitenoise gunicorn psycopg2-binary pyjwt
python seed_data.py
python manage.py migrate
python manage.py runserver 8000
```
> Backend API running at **http://127.0.0.1:8000/api**

---

## 🔑 Default Login Credentials

### 1. Student Login / Registration
- **Email**: `sumit@college.edu` (or any `@college.edu` email)
- **Password**: Any test password

### 2. Faculty Login
- **Employee ID**: `EMP-101`, `EMP-102`, or `EMP-103`
- **Department**: Computer Science & Engineering

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Glassmorphism Design
- **Backend**: Python 3.11, Django REST Framework, SQLite / PostgreSQL
- **AI / NLP**: spaCy NLP skill vector parsing, `pypdf` text extraction, Sentence-BERT semantic similarity
