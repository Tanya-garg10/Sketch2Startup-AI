# Sketch2Startup AI 🚀

<div align="center">

**Transform sketches into production-ready full-stack applications with AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19-61DAFB.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-green.svg)](https://fastapi.tiangolo.com/)

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [Deployment](#deployment) • [Contributing](#contributing)

</div>

---

## 🌟 Features

Sketch2Startup AI is an AI-powered platform that transforms hand-drawn sketches, wireframes, whiteboard photos, and UI screenshots into deployment-ready full-stack applications.

### Core Capabilities

- **🎨 Vision Analysis**: AI-powered image recognition detects UI elements, layouts, and components from sketches
- **📋 Agentic PRDs**: Automatically generate comprehensive Product Requirement Documents with user stories
- **🗄️ Database Schemas**: Production-ready database designs with ER diagrams and migration scripts
- **🔌 REST APIs**: Complete API endpoints with authentication, validation, and Swagger documentation
- **⚛️ React/FastAPI Code**: Full-stack code generation with modern best practices and clean architecture
- **🧪 Test Suites**: Automated generation of unit tests, integration tests, and API tests
- **📚 Documentation**: Comprehensive documentation including README, API docs, and deployment guides
- **🚀 Deployment Configs**: Ready-to-deploy configurations for Vercel, Render, and Docker

### AI Agents

The platform uses specialized AI agents that work together:

1. **Planner Agent**: Generates Product Requirement Documents
2. **Architect Agent**: Designs system architecture and component structure
3. **Database Agent**: Creates database schemas and relationships
4. **API Agent**: Generates REST API endpoints and documentation
5. **Builder Agent**: Produces React frontend and FastAPI backend code
6. **Tester Agent**: Creates comprehensive test suites
7. **Documentation Agent**: Generates project documentation
8. **Deployment Agent**: Creates deployment configurations

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- React 19 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- shadcn/ui for components
- React Router for navigation
- TanStack Query for data fetching
- Framer Motion for animations
- Monaco Editor for code editing

**Backend**
- FastAPI (Python 3.12)
- SQLAlchemy for ORM
- PostgreSQL for production (SQLite for development)
- Firebase Admin SDK for authentication
- Firebase Storage for file storage

**Authentication & Storage**
- Firebase Auth for user authentication
- Firebase Storage for file uploads
- JWT token-based authorization

**Deployment**
- Vercel for frontend hosting
- Render for backend hosting
- Docker for containerization
- GitHub Actions for CI/CD

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│   FastAPI API   │────│   PostgreSQL    │
│   (Vercel)      │    │   (Render)      │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────┬───────────┘                       │
                     │                                   │
         ┌───────────▼───────────┐                       │
         │   Firebase Services    │                       │
         │   (Auth + Storage)     │                       │
         └───────────────────────┘                       │
                     │                                   │
         ┌───────────▼───────────┐                       │
         │     AI Agents         │◄──────────────────────┘
         │  (Planner, Architect, │
         │   Builder, etc.)      │
         └───────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (for production)
- Firebase project with Auth and Storage enabled

### Clone the Repository

```bash
git clone https://github.com/yourusername/Sketch2Startup-AI.git
cd Sketch2Startup-AI
```

### Backend Setup

1. **Create a virtual environment and install dependencies:**

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sketch2startup
CORS_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
OPENAI_API_KEY=your-openai-api-key
```

3. **Initialize the database:**

```bash
python -c "from app.db.session import Base, engine; Base.metadata.create_all(bind=engine)"
```

4. **Start the backend server:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies:**

```bash
cd client
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

3. **Start the development server:**

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🚀 Usage

### 1. User Registration

1. Navigate to `http://localhost:5173`
2. Click "Get Started Free"
3. Sign up using Firebase Auth (email/password)

### 2. Upload Sketch

1. Go to Dashboard → Upload Sketch
2. Drag and drop or click to upload your sketch/image
3. Supported formats: PNG, JPG, JPEG, PDF
4. Click "Upload & Analyze"

### 3. AI Analysis

The AI will automatically:
- Detect UI elements (buttons, forms, navigation, etc.)
- Identify layout patterns
- Suggest component structure
- Generate analysis report

### 4. Generate Artifacts

Use the AI agents to generate:

- **PRD**: Product Requirement Document
- **Architecture**: System design and component structure
- **Database**: Schema and migrations
- **API**: REST endpoints with documentation
- **Frontend**: React components and pages
- **Backend**: FastAPI implementation
- **Tests**: Unit and integration tests
- **Documentation**: Complete project docs

### 5. Export & Deploy

- Download generated code and documentation
- Use provided deployment configs
- Deploy to Vercel (frontend) and Render (backend)

---

## 🌐 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Manual deployment
vercel --prod
```

### Backend (Render)

1. Connect your GitHub repository to Render
2. Configure environment variables in Render dashboard
3. Set up PostgreSQL database
4. Deploy automatically on push to main branch

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Individual services
docker-compose up api
docker-compose up client
```

### Environment Variables

**Production Frontend (.env.production):**
```env
VITE_API_URL=https://your-api.onrender.com
VITE_FIREBASE_API_KEY=production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
```

**Production Backend (.env.production):**
```env
DATABASE_URL=postgresql://user:password@host:5432/database
CORS_ORIGINS=https://your-frontend.vercel.app
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
OPENAI_API_KEY=your-openai-api-key
```

---

## 🧪 Testing

### Backend Tests

```bash
cd server
pytest tests/ -v
pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd client
npm test
npm run test:coverage
```

### API Testing

Use the Swagger UI at `http://localhost:8000/docs` to test API endpoints interactively.

---

## 📁 Project Structure

```
Sketch2Startup-AI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── layout/    # Layout components
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   └── generator/ # Generator components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── server/                # FastAPI backend
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core configuration
│   │   ├── db/            # Database configuration
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── main.py        # FastAPI app
│   ├── tests/             # Backend tests
│   ├── requirements.txt
│   └── Dockerfile
├── agents/                # AI agent configurations
├── docs/                  # Documentation
├── docker-compose.yml     # Docker Compose config
├── render.yaml           # Render deployment config
└── README.md
```

---

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password)
3. Enable Storage
4. Download service account key
5. Configure environment variables

### Database Setup

**Development (SQLite):**
```env
DATABASE_URL=sqlite:///./dev.db
```

**Production (PostgreSQL):**
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication powered by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

- 📧 Email: support@sketch2startup.ai
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/Sketch2Startup-AI/issues)
- 📖 Documentation: [Full Docs](https://docs.sketch2startup.ai)

---

<div align="center">

**Built with ❤️ by the Sketch2Startup AI team**

[⭐ Star us on GitHub](https://github.com/yourusername/Sketch2Startup-AI) • [🐦 Follow us on Twitter](https://twitter.com/sketch2startup)

</div>