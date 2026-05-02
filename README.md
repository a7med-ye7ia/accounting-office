# Accounting Office Management System

A comprehensive web-based accounting office management system built with React, Vite, Spring Boot, and PostgreSQL.

##  Project Overview

This application provides a complete solution for managing:
- **Companies** - Company information and management
- **Departments** - Organizational structure and departments
- **Employees** - Employee records and management
- **Tasks** - Task assignment and tracking
- **Contracts** - Contract management and documentation
- **Documents** - Document storage and management
- **Ledger** - Financial ledger and accounting records

##  Design

### Figma Design & Prototypes
View the complete UI/UX design and interactive prototypes:
- **[Figma Project Link](https://stitch.withgoogle.com/projects/5366474749468535219)**

##  Architecture

### Monorepo Structure
```
accounting-office/
├── Backend/          # Spring Boot REST API
├── Frontend/         # React + Vite SPA
└── AI/              # OCR and AI processing modules
```

-- **[sheet project ](https://docs.google.com/spreadsheets/d/1xzV4TuH4lyXPK4KlGP7_SPIjBbRK71yC8YEO3o1d9e8/edit)**

### Tech Stack

**Backend:**
- Java 25
- Spring Boot 3.x
- Spring Data JPA
- PostgreSQL
- Maven

**Frontend:**
- React 18+
- Vite
- Tailwind CSS
- Axios (API client)
- i18n (Internationalization - English & Arabic)

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL Database

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Java 25+ (for local backend development)
- Maven 3.9+ (for local backend development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd accounting-office
   ```

2. **Build and run all services**
   ```bash
   docker-compose build
   docker-compose up
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

### Local Development Setup

#### Backend (Spring Boot)
```bash
cd Backend
./mvnw clean install
./mvnw spring-boot:run
```
Backend runs on: http://localhost:8080

#### Frontend (React + Vite)
```bash
cd Frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173 (Vite dev server)

## 📦 Docker Deployment & Management

Here are the essential Docker commands needed to manage the application:

```bash
# 1. Build and run all services in the background (Most important)
docker-compose up -d --build

# 2. Stop all running services
docker-compose down

# 3. Stop services and remove volumes (wipes the database to start fresh)
docker-compose down -v

# 4. View and follow real-time logs for debugging
docker-compose logs -f

# 5. Access the PostgreSQL database shell directly
docker-compose exec db psql -U postgres -d accounting_db

# 6. Check the status of running containers
docker-compose ps

# 7. Access the backend container shell (Terminal)
docker-compose exec backend bash

# 8. Rebuild a specific service only (e.g., after modifying backend code)
docker-compose build backend && docker-compose up -d backend
```

## 🌍 Internationalization

The application supports multiple languages:
- **English** - Default
- **Arabic** - العربية

### Switching Languages
Language selection is available in the navigation bar. User preference is stored in context state.

## 📁 Project Structure

### Backend Structure
```
Backend/
├── src/main/java/com/accounting/backend/
│   ├── controller/     # REST Controllers
│   ├── service/        # Business Logic
│   ├── repository/     # Data Access
│   ├── model/          # JPA Entities
│   ├── dto/            # Data Transfer Objects
│   └── config/         # Spring Configuration
├── src/test/java/      # Unit Tests
├── pom.xml            # Maven Dependencies
└── Dockerfile         # Container Configuration
```

### Frontend Structure
```
Frontend/
├── src/
│   ├── api/           # API Client Services
│   ├── components/    # Reusable Components
│   ├── features/      # Feature Modules
│   ├── context/       # React Context (State Management)
│   ├── shared/        # Shared Components & Utilities
│   ├── i18n/          # Internationalization Config
│   ├── locales/       # Translation Files
│   └── styles/        # Global Styles
├── package.json       # NPM Dependencies
└── Dockerfile         # Container Configuration
```

## 🔧 Environment Variables

### Backend (Docker)
```env
SPRING_PROFILES_ACTIVE=docker
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/accounting_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=1234
```

### Frontend (Docker)
```env
VITE_API_BASE_URL=http://backend:8080
```

## 📝 API Endpoints

### Companies
- `GET /api/companies` - List all companies
- `POST /api/companies` - Create company
- `GET /api/companies/{id}` - Get company details
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `GET /api/employees/{id}` - Get employee details
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Departments
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department
- `GET /api/departments/{id}` - Get department details

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task

### Ledger
- `GET /api/ledger` - Get ledger entries
- `POST /api/ledger` - Create ledger entry

### Contracts
- `GET /api/contracts` - List all contracts
- `POST /api/contracts` - Create contract

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload document

## 🔐 Security

- Non-root user execution in Docker containers
- Health checks for all services
- Database connection pooling
- Secure environment variable management
- Input validation and sanitization

## 📊 Database Schema

PostgreSQL database includes tables for:
- companies
- departments
- employees
- tasks
- contracts
- documents
- ledger_entries

## 🧪 Testing

### Backend Tests
```bash
cd Backend
./mvnw test
```

### Frontend Tests
```bash
cd Frontend
npm test
```

## 🚢 Production Deployment

### Docker Registry Push
```bash
# Tag images
docker tag accounting-backend:latest <registry>/accounting-backend:latest
docker tag accounting-frontend:latest <registry>/accounting-frontend:latest

# Push to registry
docker push <registry>/accounting-backend:latest
docker push <registry>/accounting-frontend:latest
```

### Kubernetes Deployment
Update the docker-compose.yml or create Kubernetes manifests for production deployment.

---



**Last Updated**: May 3, 2026
