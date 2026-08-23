# Semantic Opportunity Alignment - AI Student & Faculty Placement Portal

A modern full-stack web application designed for automated resume parsing (spaCy NLP), Sentence-BERT placement opportunity matching, student verification workflows, and faculty approval management.

---

## 🌟 Key Features

* **Student Dashboard**:
  - **Resume Parsing Engine (spaCy NLP & pypdf)**: Upload PDF/DOCX resumes with instant text extraction & verified technical skill matrix generation.
  - **Live PDF Document Viewer**: Embedded in-browser PDF viewer with direct download and inspector controls.
  - **Sentence-BERT Matcher**: Cosine similarity matching between student profiles & placement opportunities.
  - **Verification Flow**: Automatic sync of student verification requests with the faculty portal.

* **Faculty Portal**:
  - **Student Approval Queue**: Review, verify, approve, or reject student registration requests.
  - **Live Database Sync**: Updates SQLite student verification status & ORM models in real-time.
  - **Faculty Credentials**: Log in using Employee IDs (`EMP-101`, `EMP-102`, `EMP-103`).

---

## 🚀 How to Run the Project Locally

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

### Step 2: Set Up & Start the Frontend (Vite + React)
```bash
# Install frontend dependencies
npm install

# Start the Vite local development server
npm run dev
```
> Frontend will be running at **http://localhost:5173**

---

### Step 3: Set Up & Start the Backend (Django + SQLite)
Open a new terminal window:
```bash
cd backend

# Install Python dependencies
pip install django djangorestframework django-cors-headers pypdf whitenoise gunicorn psycopg2-binary pyjwt

# Seed/Reset clean database
python seed_data.py

# Run database migrations
python manage.py migrate

# Start Django backend server
python manage.py runserver 8000
```
> Backend REST API will be running at **http://127.0.0.1:8000/api**

---

## 🔑 Login & Test Credentials

### 1. Student Sign-In / Register
- **Email**: `sumit@college.edu` (or any `@college.edu` institutional email)
- **Password**: Any test password

### 2. Faculty Sign-In
- **Faculty Employee ID**: `EMP-101` (or `EMP-102`, `EMP-103`)
- **Department**: Computer Science & Engineering

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Glassmorphism Design
- **Backend**: Python 3.11, Django REST Framework, SQLite
- **AI / NLP**: spaCy NLP skill vector extraction, `pypdf` text parsing
