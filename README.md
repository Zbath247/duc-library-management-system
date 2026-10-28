# DUC Library Management System (បណ្ណាល័យសាកលវិទ្យាល័យឌីជីថលកម្ពុជា)

A modern, university-grade Library Management System built for the **Digital University of Cambodia (DUC)**.

![DUC Library Emblem](public/logo.png)

---

## 🌟 Key Features

- **Full Khmer & English Localization**: Instant language switching without page reload, powered by the **Kantumruy Pro** font with fallback to Noto Sans Khmer.
- **Light & Dark Mode**: Seamless visual mode toggle with saved preferences.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access, staff management, settings, audit logs, and backups.
  - **Librarian**: Catalogue management, member management, borrow/return operations, and attendance check-in.
  - **Member (Student/Staff)**: Search catalogue, check availability, view personal loan history, and reserve books.
- **Secure Authentication**: Password hashing with `bcryptjs`, and session management via secure `httpOnly` cookies.
- **Zero-Config Database**: Powered by SQLite (Node.js 24 native engine / better-sqlite3) with WAL mode enabled.
- **Seed Dataset**: Pre-populated with 35+ realistic books, 25+ members (students and faculty), and active/overdue loan records.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Node.js v20+ or v24+
- Git

### 2. Installation
```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd <REPO_FOLDER>

# Install dependencies
npm install

# Setup environment configuration
cp .env.example .env

# Run database migration & seed sample data
npm run setup
```

### 3. Start Application
```bash
npm start
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 🔑 Default Demo Accounts

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | System Administrator (Full Access) |
| **Librarian** | `librarian` | `lib123` | Sokha Chea (ជា សុខា) - Staff |
| **Member** | `student1` | `student123` | Vanna Chan (ចាន់ វណ្ណា) - Student |

---

## 📁 Project Structure

```text
├── public/                 # Frontend assets (No build step required)
│   ├── css/                # DUC royal blue & gold design system
│   ├── js/                 # ES Modules (app, i18n, api, state)
│   ├── locales/            # Translation files (km.json, en.json)
│   └── logo.png            # DUC Library crest logo
├── src/
│   ├── config/             # Database connection & constants
│   ├── db/                 # SQL schema, migration & seed scripts
│   ├── middleware/         # Auth (httpOnly cookie RBAC) & audit logging
│   └── routes/             # REST API routes (auth, users, books, loans, etc.)
├── server.js               # Express application entrypoint
├── package.json
└── README.md
```

---

## 🛡️ License
Developed for Digital University of Cambodia (DUC).
