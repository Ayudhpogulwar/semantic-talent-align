# TalentAlign AI (SAIOTAF) — Frontend UI Design System & Theme Specification

> **Documentation Directive for Team Members**: This document specifies the exact CSS tokens, glassmorphism UI guidelines, dynamic Light/Dark theme configuration, typography, and component patterns used in the **Student Dashboard**. Use this guide to build the **Faculty Dashboard** so both frontend modules share 100% visual consistency, brand harmony, and smooth user experience.

---

## 1. Core Typography & Font Imports

Both the **Student Dashboard** and **Faculty Dashboard** must pre-load the following Google Fonts:

* **Heading & Metrics Font**: `'Space Grotesk', sans-serif` (Weights: `500`, `600`, `700`)
* **Body & UI Controls Font**: `'Plus Jakarta Sans', sans-serif` (Weights: `300`, `400`, `500`, `600`, `700`, `800`)

### Google Font Import Link (`index.html` or `index.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
```

---

## 2. Dynamic Light / Dark Theme Tokens (`index.css`)

Themes are toggled dynamically by adding `data-theme="light"` or `data-theme="dark"` attribute to `document.documentElement` (`<html>` element).

```css
:root {
  /* Default Dark Mode Theme Tokens */
  --bg-dark: #0b0f19;
  --bg-card: rgba(18, 26, 43, 0.85);
  --bg-card-hover: rgba(28, 40, 65, 0.95);
  --border-color: rgba(255, 255, 255, 0.1);
  --border-glow: rgba(99, 102, 241, 0.35);
  
  --primary: #6366f1;         /* Indigo Primary */
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --accent-cyan: #06b6d4;     /* Cyan Accent */
  --accent-emerald: #10b981;  /* Emerald Accent */
  --accent-amber: #f59e0b;    /* Amber Accent */
  --accent-rose: #f43f5e;     /* Rose Accent */
  --accent-purple: #a855f7;   /* Purple Accent */

  --text-main: #f8fafc;       /* Bright Crisp White */
  --text-muted: #cbd5e1;      /* Light Slate */
  --text-dim: #94a3b8;        /* Muted Grey */
  --input-bg: rgba(15, 23, 42, 0.7);

  --shadow-glow: 0 0 25px rgba(99, 102, 241, 0.18);
  --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-heading: 'Space Grotesk', sans-serif;
}

[data-theme="light"] {
  /* Light Mode High-Contrast Overrides */
  --bg-dark: #f1f5f9;         /* Light Slate Background */
  --bg-card: #ffffff;         /* Pure Crisp White Glass Panels */
  --bg-card-hover: #f8fafc;
  --border-color: #cbd5e1;
  --border-glow: rgba(79, 70, 229, 0.3);
  
  --primary: #4338ca;
  --primary-light: #4f46e5;
  --primary-dark: #3730a3;
  --accent-cyan: #0284c7;
  --accent-emerald: #047857;
  --accent-amber: #b45309;
  --accent-rose: #be123c;
  --accent-purple: #7e22ce;

  --text-main: #0f172a;       /* Deep Slate Main Text (High Visibility) */
  --text-muted: #1e293b;      /* Dark Slate Secondary Text */
  --text-dim: #475569;        /* Medium Slate Text */
  --input-bg: #ffffff;

  --shadow-glow: 0 10px 30px rgba(79, 70, 229, 0.15);
}
```

---

## 3. Ambient Multi-Color Radial Mesh Background

To avoid single-color boring backgrounds, the body utilizes a 4-point atmospheric mesh background gradient:

```css
body {
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: var(--font-main);
  min-height: 100vh;
  overflow-x: hidden;
  transition: background-color 0.4s ease, color 0.4s ease;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 45%),
    radial-gradient(circle at 90% 15%, rgba(6, 182, 212, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 50% 60%, rgba(168, 85, 247, 0.16) 0%, transparent 55%),
    radial-gradient(circle at 80% 85%, rgba(16, 185, 129, 0.14) 0%, transparent 45%);
  background-attachment: fixed;
}

[data-theme="light"] body {
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 90% 15%, rgba(14, 165, 233, 0.14) 0%, transparent 50%),
    radial-gradient(circle at 50% 60%, rgba(192, 132, 252, 0.1) 0%, transparent 55%),
    radial-gradient(circle at 80% 85%, rgba(16, 185, 129, 0.1) 0%, transparent 45%);
}
```

---

## 4. Glassmorphism Card System (`.glass-panel`)

All UI cards, modals, and container modules must extend `.glass-panel`:

```css
.glass-panel {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .glass-panel {
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.glass-panel:hover {
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}
```

---

## 5. Multi-Color Vibrant Gradient Headings (`.gradient-text`)

Use `.gradient-text` for major section titles and key hero words:

```css
.gradient-text {
  background: linear-gradient(135deg, #818cf8 0%, #38bdf8 40%, #c084fc 75%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

[data-theme="light"] .gradient-text {
  background: linear-gradient(135deg, #4338ca 0%, #0284c7 40%, #7e22ce 75%, #be123c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 6. Button & Control Design Tokens

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

[data-theme="light"] .btn-secondary {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}
```

---

## 7. Status Badges & Pills (`.badge`)

Standard status badges across applications, verification statuses, and approvals:

```css
.badge-success {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-info {
  background: rgba(6, 182, 212, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(6, 182, 212, 0.3);
}
```

---

## 8. Theme Switcher Implementation Snippet (For Team Member)

Copy this theme switcher hook pattern in your **Faculty Dashboard** header:

```jsx
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button 
      onClick={toggleTheme}
      className="btn btn-secondary"
      style={{ padding: '8px 12px', borderRadius: '10px' }}
      title="Toggle Light / Dark Mode"
    >
      {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
    </button>
  );
}
```

---

## 9. Checklist for Faculty Dashboard Development Team

To guarantee both dashboards look like part of the exact same application suite:
- [ ] Import Google Fonts (*Space Grotesk* + *Plus Jakarta Sans*).
- [ ] Copy the `index.css` theme variables and `[data-theme="light"]` overrides.
- [ ] Wrap main layout panels in `.glass-panel`.
- [ ] Use `var(--text-main)` for main text and `var(--text-muted)` for subtitles to maintain light/dark visibility.
- [ ] Use `lucide-react` for all dashboard icons.
- [ ] Include the top-right Sun/Moon theme toggle component.
