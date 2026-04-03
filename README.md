<p align="center">
  <h1 align="center">HireBlind</h1>
  <p align="center">
    <strong>The Enterprise-Grade B2B SaaS for Bias-Free Resume Screening</strong>
    <br>
    Built for fairness, transparency, and data privacy.
  </p>
</p>

<p align="center">
  <a href="#key-features"><strong>Features</strong></a> ·
  <a href="#technology-stack"><strong>Tech Stack</strong></a> ·
  <a href="#installation--setup"><strong>Quick Setup</strong></a> ·
  <a href="#architecture--roles"><strong>Architecture</strong></a>
</p>

---

## 🌟 Overview

**HireBlind** is a modern, privacy-first recruitment platform designed to eliminate unconscious bias from the hiring process. By securely anonymizing Personally Identifiable Information (PII) and leveraging a deterministic scoring engine, HireBlind ensures that candidates are evaluated strictly on their skills and merit.

With robust multi-tenant workspace isolation, detailed diversity analytics, and a seamless 3-role architecture, HireBlind is built for modern enterprise recruitment teams.

## ✨ Key Features

- **🛡️ PII Anonymization Engine**: Automatically redacts names, genders, ages, and other identifiers from resumes before they reach the recruiter.
- **🏢 Multi-Tenant Workspace Isolation**: Secure your organization's data with unique workspace codes tying Admins, Recruiters, and candidates together.
- **📊 Diversity & Fairness Analytics**: Built-in visual dashboards tracking bias metrics and ensuring equitable screening across job requisitions.
- **🤖 Deterministic Interview Generation**: Auto-generate consistent, role-specific interview questions based on anonymized candidate profiles.
- **📧 Blind Email Dispatch**: Communicate seamlessly with shortlisted candidates without compromising their anonymized identities.

## 💻 Technology Stack

**Frontend**
- **React.js**: Component-driven UI.
- **Tailwind CSS / Vanilla CSS**: Stunning, responsive modern web design.
- **Context API/Redux**: Global state management.

**Backend**
- **Node.js & Express.js**: High-performance RESTful API.
- **MongoDB & Mongoose**: Flexible, schema-driven NoSQL database.
- **JWT (JSON Web Tokens)**: Secure, stateless authentication.

## 🏗️ Architecture & Roles

HireBlind operates on a strict **2-Role Architecture**:

1. **System Admin**: Manages tenant workspaces, configurations, and oversees high-level audit logs.
2. **Recruiter**: Reviews anonymized resumes, generates interview questions, and manages multiple job requisitions within their scoped workspace.

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YuvikaSingodia10/COPULAR_PROJECT.git
cd COPULAR_PROJECT
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend development server:
```bash
npm run dev
```

### 3. Setup the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory (if required):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the React development server:
```bash
npm start
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/YuvikaSingodia10/COPULAR_PROJECT/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the HireBlind Team.
</p>
