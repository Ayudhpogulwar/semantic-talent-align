# semantic-talent-align — Project Repository Overview & Setup Guide

This repository contains the complete codebase and technical specification for **semantic-talent-align** (SAIOTAF — Semantic-Aware Intelligent Opportunity & Talent Alignment Framework).

---

## 📁 Repository Structure

```
semantic-talent-align/
├── PRD.md                            # Comprehensive System Product Requirement Document (PRD)
├── FRONTEND_DOCUMENTATION.md         # Detailed React.js Frontend Architecture Documentation
├── FRONTEND_DESIGN_SYSTEM_THEME.md   # UI Design System, CSS Tokens & Theme Guide for Team
└── student-dashboard/
    ├── package.json                  # React frontend dependencies
    ├── vite.config.js                # Vite build configuration
    ├── index.html                    # Entry HTML & Google Fonts preloads
    ├── src/                          # React Frontend Source Code
    │   ├── main.jsx                  # Application entry point
    │   ├── App.jsx                   # Root component & tab state routing
    │   ├── index.css                 # Glassmorphism design tokens & 4-point mesh lighting
    │   ├── components/               # Modular UI Component Library
    │   └── services/                 # API Client Service (api.js)
    └── backend/                      # Python Django REST Backend
        ├── manage.py                 # Django CLI management entry point
        ├── database.py               # MySQL DBWrapper & Connection Layer (saiotaf_db)
        ├── schema.sql                # Official SAIOTAF Relational DDL & DML Seed Script
        ├── requirements.txt          # Python Backend Dependencies (Django 5.x, DRF, MySQL)
        ├── django_backend/           # Django Project Root (settings.py, urls.py)
        └── api/                      # Django REST API App (views.py, urls.py)
```

---

## ⚡ Quick Start Guide

### 1. Database Setup (MySQL)
Ensure MySQL Server is running on `localhost:3306`:
```sql
-- Execute schema.sql to create saiotaf_db and seed sample data
mysql -u root -p < student-dashboard/backend/schema.sql
```

### 2. Run Python Django REST Backend
```bash
cd student-dashboard/backend
python manage.py runserver 8000
```
*Backend API will run at `http://127.0.0.1:8000/api`*

### 3. Run React Frontend Development Server
```bash
cd student-dashboard
npm run dev
```
*Frontend Portal will run at `http://localhost:5173`*

---

## 🛠️ Tech Stack Summary
* **Frontend**: React.js, Vite 8.2, Lucide React, Glassmorphism CSS System with Light/Dark Mode.
* **Backend**: Python 3.13, Django 5.x LTS, Django REST Framework.
* **Database**: MySQL 8.0 (`saiotaf_db`).
