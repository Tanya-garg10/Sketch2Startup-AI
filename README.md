# 🚀 Sketch2Startup AI

**Transform Sketches into Production-Ready Applications in Minutes**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.12-yellow?style=for-the-badge&logo=python)
![MIT](https://img.shields.io/badge/License-MIT-success?style=for-the-badge)

## 💡 Problem Statement

Turning a simple idea into a working application is time-consuming. A single sketch must go through multiple stages:

- Product Planning
- Requirement Documentation  
- System Architecture
- Database Design
- API Development
- Frontend Development
- Backend Development
- Testing
- Documentation
- Deployment

This process often takes days or even weeks.

## ✅ Solution

**Sketch2Startup AI** automates the entire software development lifecycle. Users simply upload a hand-drawn sketch or wireframe, and our AI agents collaboratively analyze the design and generate:

- Product Requirement Document
- System Architecture
- Database Schema
- REST APIs
- Frontend & Backend Code
- Testing Suites
- Documentation
- Deployment Configurations

All from a single sketch.

## ✨ Features

### 🎨 Vision Analysis
- Detects UI components: Buttons, Forms, Inputs, Cards, Images, Navigation Bars, Tables
- Analyzes layout structure and user flows
- Identifies app type and features automatically

### 📋 Automatic PRD Generation
- Product Name & Problem Statement
- User Stories & Requirements
- Technical Specifications
- Acceptance Criteria & Future Scope

### 🏗 Architecture Generation
- System Architecture Design
- Component Flow & Data Flow
- Authentication Strategy
- Scalability Planning

### 🗄 Database Generator
- Database Tables & Relationships
- SQL Scripts & ER Diagrams
- Indexes & Constraints
- Migration Scripts

### 🔌 REST API Generator
- Complete CRUD APIs
- Validation & Authentication
- Swagger Documentation
- Error Handling

### ⚛ Frontend Generator
- React Components & Pages
- Responsive Design with Tailwind CSS
- Dark Mode Support
- Reusable Component Library

### ⚙ Backend Generator
- FastAPI Backend Implementation
- Business Logic & Database Integration
- File Upload APIs
- Authentication Middleware

### 🧪 Testing Generator
- Unit Tests & Integration Tests
- API Testing
- Test Coverage Reports

### 📚 Documentation Generator
- Complete README
- API Documentation
- Installation & Deployment Guides
- Folder Structure Documentation

### 🚀 Deployment Generator
- Vercel Configuration
- Render Configuration
- Docker Support
- CI/CD Pipelines

## 🤖 AI Agent Workflow

| AI Agent | Responsibility |
|----------|---------------|
| 👁 Vision Agent | Detects UI components from uploaded sketches using Gemini Vision |
| 📋 Planner Agent | Creates Product Requirement Documents based on detected features |
| 🏗 Architect Agent | Designs system architecture specific to app type |
| 🗄 Database Agent | Generates database schemas for detected data requirements |
| 🔌 API Agent | Generates REST APIs for identified features |
| 💻 Builder Agent | Generates frontend & backend code matching detected UI |
| 🧪 Tester Agent | Creates automated tests for the application |
| 📚 Documentation Agent | Generates project documentation |
| 🚀 Deployment Agent | Creates deployment configuration |

## 🔄 Workflow

```
Upload Sketch → Vision Analysis → PRD Generation → Architecture Design → 
Database Schema → REST API Generation → Frontend Generation → 
Backend Generation → Testing → Documentation → Deployment
```

## 🏗 Tech Stack

### Frontend
- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component Library
- **React Router** - Navigation
- **Framer Motion** - Animations
- **TanStack Query** - Data Fetching

### Backend
- **FastAPI** - Web Framework
- **Python 3.12** - Programming Language
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database (Production)
- **SQLite** - Database (Development)

### AI & ML
- **Gemini Vision** - Image Analysis
- **Groq LLM** - Text Generation
- **Tavily Search** - Research Context

### Infrastructure
- **Firebase Authentication** - User Auth
- **Firebase Storage** - File Storage
- **Vercel** - Frontend Deployment
- **Render** - Backend Deployment
- **Docker** - Containerization

## 📂 Project Structure

```
Sketch2Startup-AI/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── pages/         # Page Components
│   │   ├── hooks/         # Custom Hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript Types
│   └── package.json
├── server/                # FastAPI Backend
│   ├── app/
│   │   ├── api/          # API Routes
│   │   ├── core/         # Configuration
│   │   ├── db/           # Database
│   │   ├── models/       # SQLAlchemy Models
│   │   ├── schemas/      # Pydantic Schemas
│   │   └── services/     # Business Logic
│   ├── requirements.txt
│   └── main.py
├── agents/                # AI Agent Modules
│   ├── planner/
│   ├── architect/
│   ├── database/
│   ├── api/
│   ├── builder/
│   ├── tester/
│   ├── documentation/
│   └── deployment/
├── docs/                  # Documentation
├── docker-compose.yml
├── render.yaml
└── README.md
```

## ⚡ How It Works

### Step 1: Upload Sketch
Upload a sketch, wireframe, or whiteboard image (PNG, JPG, PDF)

### Step 2: Vision Analysis
AI detects all UI components, app type, features, and user flows

### Step 3: PRD Generation
Planner Agent creates a detailed Product Requirement Document

### Step 4: Architecture Design
Architecture Agent designs the complete system architecture

### Step 5: Database Schema
Database Agent creates tables, relationships, and SQL schema

### Step 6: API Generation
API Agent generates production-ready REST APIs

### Step 7: Code Generation
Builder Agent creates the React frontend and FastAPI backend

### Step 8: Testing
Testing Agent generates automated test cases

### Step 9: Documentation
Documentation Agent creates complete project documentation

### Step 10: Deployment
Deployment Agent prepares deployment configurations

## 🚀 Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- Git

### Clone Repository
```bash
git clone https://github.com/Tanya-garg10/Sketch2Startup-AI.git
cd Sketch2Startup-AI
```

### Backend Setup
```bash
cd server
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL=sqlite:///./dev.db
CORS_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
TAVILY_API_KEY=your-tavily-api-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
DEMO_MODE=false
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
```

## 🌐 Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Automatic deployment on push to main branch

### Backend (Render)
1. Connect GitHub repository to Render
2. Configure environment variables in Render dashboard
3. Set up PostgreSQL database
4. Automatic deployment on push to main branch

### Docker
```bash
docker-compose up -d
```

## 🧪 Testing

### Backend Tests
```bash
cd server
pytest tests/ -v
```

### Frontend Tests
```bash
cd client
npm test
```

## 🧠 Built with ChatGPT Codex

This project was built for the **ChatGPT Codex Hackathon 2026**.

Planning, wireframes, architecture, and product design were prepared before development, while **ChatGPT Codex** was used for code generation, debugging, refactoring, and iterative implementation of the application.

## 👩‍💻 Author

**Tanya Garg**
🎓 B.Tech Information Technology
📧 Email: tanyagarg5315@gmail.com
💻 GitHub: https://github.com/Tanya-garg10

## 📄 License

This project is licensed under the MIT License.

## ⭐ Acknowledgments

- **Gemini Vision** for powerful image analysis
- **Groq** for fast LLM inference
- **Tavily** for real-time research context
- **Firebase** for authentication and storage
- **shadcn/ui** for beautiful UI components

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, email tanyagarg5315@gmail.com or open an issue in the GitHub repository.

**⭐ If you like this project, please give it a star!**
