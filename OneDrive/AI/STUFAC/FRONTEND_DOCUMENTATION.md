# TalentAlign AI — Frontend Documentation
## Semantic-Aware Intelligent Opportunity & Talent Alignment Framework (SAIOTAF)
### Student Opportunity & Placement Dashboard

---

## 1. Executive Summary & Architecture Overview

The **TalentAlign AI Student Opportunity & Placement Dashboard** is a high-performance React.js single-page application (SPA) designed as part of the **Semantic-Aware Intelligent Opportunity & Talent Alignment Framework (SAIOTAF)**.

It provides higher education students with an end-to-end portal to manage academic credentials, upload resumes for automated NLP skill extraction, review personalized AI-matched internships and NGO positions, track application lifecycle pipelines, and monitor real-time placement readiness scores.

```
                  +-----------------------------------+
                  |   TalentAlign AI SPA (React.js)   |
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+---------v---------+     +---------v---------+     +---------v---------+
|   UI Components   |     | State & Routing   |     | API Integration   |
| (Lucide Icons &   |     | (Tab Context &    |     | (Django REST API  |
| CSS Design Tokens)|     | Local Storage)    |     | Client Service)   |
+-------------------+     +-------------------+     +-------------------+
```

---

## 2. Technology Stack & Dependencies

* **UI Framework**: React.js (Vite 8.2)
* **Styling & Theme Engine**: Vanilla CSS3 with CSS Variables, Dynamic Light/Dark Mode Tokens, Glassmorphism Backdrop Filters (`blur(20px)`), and CSS Grid / Flexbox Layouts.
* **Typography**: Google Fonts — *Space Grotesk* (Headings & Metrics) and *Plus Jakarta Sans* (Body).
* **Icons**: `lucide-react` (v0.344.0).
* **Backend Communication**: RESTful HTTP via custom fetch client (`apiService`) connected to Python Django REST framework (`http://localhost:8000/api`).

---

## 3. Directory Structure

```
student-dashboard/
├── index.html                     # HTML5 Entry point & Google Font preloads
├── package.json                   # Vite & React dependencies
├── src/
│   ├── main.jsx                   # React DOM root entry point
│   ├── App.jsx                    # Root component, state manager & modal overlay
│   ├── index.css                  # Global CSS tokens, theme variables & animations
│   ├── App.css                    # Structural utility styles
│   ├── components/                # Modular UI component library
│   │   ├── LandingIntroPage.jsx   # Public introduction hero page & theme toggle
│   │   ├── AuthModal.jsx          # Institutional Sign In / Registration modal
│   │   ├── HeaderNavbar.jsx       # Top navigation bar, tab switching & user profile menu
│   │   ├── DashboardOverview.jsx  # Student KPI summary & quick action dashboard
│   │   ├── ProfileModule.jsx      # Academic credentials & consent management
│   │   ├── ResumeSkillsModule.jsx # Drag-and-drop resume upload & skill tagger
│   │   ├── OpportunitiesModule.jsx# Internship & NGO search, filters & one-click apply
│   │   ├── ApplicationTracker.jsx # Real-time application pipeline status tracker
│   │   ├── AIRecommendations.jsx  # Explainable AI match cards & Sentence-BERT insights
│   │   └── ReadinessScoreCard.jsx # 0–100 Placement Readiness Score gauge & suggestions
│   └── services/
│       └── api.js                 # API service client connecting to Django backend
```

---

## 4. UI Component Specification

### 4.1 `LandingIntroPage.jsx`
* **Purpose**: Serves as the unauthenticated landing hero view introducing the SAIOTAF framework.
* **Key Features**:
  * Top-right theme switcher button (Sun ☀️ / Moon 🌙).
  * Sign In and Student Register call-to-action buttons.
  * 3 Feature Cards highlighted with distinct dual-tone ambient gradient borders:
    1. *spaCy Resume NLP Parsing* (Indigo/Violet `#6366f1`)
    2. *Explainable AI Recommendations* (Cyan/Emerald `#06b6d4`)
    3. *Placement Readiness Score* (Rose/Amber `#f43f5e`)

### 4.2 `AuthModal.jsx`
* **Purpose**: Handles student authentication with domain validation.
* **Key Features**:
  * Institutional domain verification (`@college.edu`).
  * Sign In & Account Registration mode toggles.
  * Clear, user-friendly error message extraction.

### 4.3 `HeaderNavbar.jsx`
* **Purpose**: Main header navigation bar for authenticated users.
* **Key Features**:
  * Brand logo: **TalentAlign AI PORTAL**.
  * Navigation Tabs: *Overview*, *Opportunities*, *Applications*, *AI Matches*, *Career Tools dropdown*.
  * Light / Dark Mode Toggle button.
  * Live Notification bell with unread indicator badge.
  * User profile dropdown avatar.

### 4.4 `DashboardOverview.jsx`
* **Purpose**: Primary landing dashboard after login.
* **Key Features**:
  * Quick metric summary cards: *Applications Active*, *Placement Readiness Score*, *Verified Skills*, *Faculty Verification Status*.
  * Actionable high-priority notifications list.
  * Recommended opportunities quick preview cards.

### 4.5 `ProfileModule.jsx`
* **Purpose**: Student profile details and institutional consent management.
* **Key Features**:
  * Editable fields: First/Last Name, Roll Number, Department, Graduation Year, CGPA, Phone Number, LinkedIn, GitHub, Bio.
  * Auto-calculated Profile Completion percentage progress bar.
  * Faculty verification badge (`Approved` / `Pending`).
  * Explicit placement drive consent checkbox.

### 4.6 `ResumeSkillsModule.jsx`
* **Purpose**: Resume upload and skill taxonomy management.
* **Key Features**:
  * Drag-and-drop PDF / DOCX upload zone.
  * Real-time parsed skills display extracted by spaCy NLP engine.
  * Manual skill search & addition interface with category tagging.
  * Version tracking of active resume snapshot.

### 4.7 `OpportunitiesModule.jsx`
* **Purpose**: Browse verified internship and NGO positions.
* **Key Features**:
  * Search input filter (Title, Organization, Skills).
  * Sector / Domain dropdown filter (`All`, `Engineering & AI`, `Environment & Community`).
  * Work Mode filter (`Remote`, `Onsite`, `Hybrid`).
  * One-click "Apply Now" button with immediate status updates.

### 4.8 `ApplicationTracker.jsx`
* **Purpose**: Application pipeline management.
* **Key Features**:
  * Pipeline status badges (`Applied`, `Under_Review`, `Shortlisted`, `Interview`, `Offered`, `Rejected`).
  * Timeline update log displaying notes and audit trail state machine status.

### 4.9 `AIRecommendations.jsx`
* **Purpose**: Explainable AI match recommendations.
* **Key Features**:
  * Match Percentage Score badge (e.g., `92% Match`).
  * Matched skills pills vs. missing skill gap pills.
  * Explainable AI (XAI) rationale snippet highlighting model source (`JobFormer-v2.1-CareerBERT`).

### 4.10 `ReadinessScoreCard.jsx`
* **Purpose**: Placement readiness gauge.
* **Key Features**:
  * Overall score breakdown (0–100).
  * Category breakdown: *Resume Quality (40%)*, *Skill Coverage (35%)*, *Application Activity (25%)*.
  * Actionable AI recommendations to increase score.

---

## 5. Styling Engine & Theme Design Tokens (`index.css`)

The design system enforces high visual contrast in both Light and Dark modes using CSS root variables:

```css
:root {
  /* Dark Mode Default Tokens */
  --bg-dark: #0b0f19;
  --bg-card: rgba(18, 26, 43, 0.85);
  --border-color: rgba(255, 255, 255, 0.1);
  --primary: #6366f1;
  --primary-light: #818cf8;
  --text-main: #f8fafc;
  --text-muted: #cbd5e1;
}

[data-theme="light"] {
  /* Light Mode High-Contrast Tokens */
  --bg-dark: #f1f5f9;
  --bg-card: #ffffff;
  --border-color: #cbd5e1;
  --primary: #4338ca;
  --primary-light: #4f46e5;
  --text-main: #0f172a;    /* Dark slate main text */
  --text-muted: #1e293b;   /* Deep slate muted text */
}
```

### Ambient Multi-Color Mesh Lighting
Backgrounds use a 4-point radial mesh:
```css
background-image: 
  radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 45%),
  radial-gradient(circle at 90% 15%, rgba(6, 182, 212, 0.18) 0%, transparent 45%),
  radial-gradient(circle at 50% 60%, rgba(168, 85, 247, 0.16) 0%, transparent 55%),
  radial-gradient(circle at 80% 85%, rgba(16, 185, 129, 0.14) 0%, transparent 45%);
```

---

## 6. API Service Layer (`services/api.js`)

The `apiService` module manages all HTTP requests to the Python Django REST backend:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate student user and issue JWT token |
| `POST` | `/api/auth/register` | Register new institutional account |
| `GET` | `/api/profile` | Retrieve student profile from `saiotaf_db` |
| `PUT` | `/api/profile` | Update profile fields |
| `GET` | `/api/resume` | Retrieve active resume & parsed NLP data |
| `POST` | `/api/resume/upload` | Upload PDF/DOCX resume file |
| `GET` | `/api/skills` | Retrieve student skill list |
| `POST` | `/api/skills` | Add new skill tag |
| `DELETE` | `/api/skills/{id}` | Remove skill tag |
| `GET` | `/api/opportunities` | Query available internship and NGO positions |
| `GET` | `/api/applications` | List active student applications |
| `POST` | `/api/applications` | Apply to an opportunity |
| `GET` | `/api/opportunities/recommendations` | Get Sentence-BERT & CareerBERT AI matches |
| `GET` | `/api/readiness` | Get Placement Readiness Score metrics |
| `GET` | `/api/notifications` | Fetch student notification queue |

---

## 7. Development & Build Commands

* **Run Local Frontend Dev Server**:
  ```bash
  npm run dev
  ```
  *(Launches Vite dev server on `http://localhost:5173`)*

* **Production Bundle Build**:
  ```bash
  npx vite build
  ```
  *(Outputs static production assets to `dist/` directory)*
