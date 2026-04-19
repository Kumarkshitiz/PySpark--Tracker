# 🚀 PySpark Tracker

A lightweight, interactive web app to practice and track your progress on PySpark questions — inspired by platforms like LeetCode, but focused on **data engineering concepts**.

---

## 📌 Overview

PySpark Tracker helps you:

* Practice structured PySpark problems
* Track progress across levels
* Maintain daily streaks
* Build consistency in data engineering preparation

---

## ✨ Features

### 🔐 Authentication

* Google OAuth login
* GitHub OAuth login
* Persistent user sessions

### 📊 Dashboard

* Level-wise structured questions
* Progress tracking (per level + overall)
* Visual progress indicators
* Expandable question lists

### ✅ Progress Tracking

* Mark questions as completed
* Auto-save progress per user
* Tracks completion timestamps

### 🔥 Streak System

* Daily streak tracking
* Automatically updated on question completion

### 📄 Question Page

* Problem statement
* Difficulty tagging (Easy / Medium / Hard)
* Concept tagging
* Expected output
* Dataset / Colab links (if provided)

---

## 🧱 Tech Stack

### Frontend

* HTML, CSS, Vanilla JavaScript
* No frameworks (lightweight + simple)

### Backend

* Supabase (PostgreSQL + Auth + APIs)

### Database

* PostgreSQL (via Supabase)

---

## 🗂️ Project Structure

```bash
project/
│
├── index.html          # Main dashboard + login
├── question.html       # Individual question page
│
├── js/
│   ├── config.js       # Supabase keys (ignored in git)
│   ├── supabase.js     # DB client setup
│   ├── dashboard.js    # Dashboard logic
│   └── question.js     # Question page logic
│
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repo

```bash
git clone https://github.com/your-username/pyspark-tracker.git
cd pyspark-tracker
```

---

### 2️⃣ Create `config.js`

Inside `js/config.js`:

```js
const SUPABASE_URL = 'your-project-url';
const SUPABASE_KEY = 'your-anon-key';
```

⚠️ This file is ignored via `.gitignore`

---

### 3️⃣ Setup Supabase

* Create a new project

* Enable Authentication:

  * Google
  * GitHub

* Set redirect URL:

```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

* Set Site URL:

```
http://localhost:5500
```

---

### 4️⃣ Run locally

Use any live server:

```bash
Live Server (VS Code)
```

OR

```bash
python -m http.server 5500
```

Open:

```
http://localhost:5500
```

---

## 🗄️ Database Schema

### Tables

* `users`
* `questions`
* `user_progress`
* `streaks`

---

### Key Relationships

* `users.id` → linked to auth users
* `user_progress.user_id` → tracks completion
* `streaks.user_id` → tracks daily activity

---

## 🔐 Security

* Row Level Security (RLS) supported
* Auth-based access control
* Each user can only access their own data

---

## 🧠 Future Improvements

* 👤 User profile (name, avatar)
* 🏆 Leaderboard
* 📅 Streak calendar UI
* 🧪 Code editor integration
* 📈 Analytics dashboard
* 🌐 Deployment (Vercel / Netlify)

---

## ⚠️ Notes

* Uses Supabase **anon key (safe for frontend)**
* Do NOT expose service role key
* OAuth works only with correct redirect configuration

---

## 🤝 Contributing

Feel free to fork, improve, and submit PRs.

---

## 📬 Contact

For suggestions or issues:

* Open a GitHub issue
* Or reach out directly

---

## ⭐ Final Thought

This project is built to make **learning PySpark structured, trackable, and consistent** —
not just solving problems, but building discipline.

---
