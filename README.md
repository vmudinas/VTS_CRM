
# VTS Store (CRM)

Full-stack web application featuring:
  - React frontend (TypeScript)
  - ASP.NET Core 9 backend API with Entity Framework Core
  - SQL Server database (via Docker)
  - Fully containerized via Docker Compose
  - Deployed to GitHub Pages at https://vmudinas.github.io/VTS_CRM/

## Table of Contents
  1. [Overview](#overview)
  2. [How This Application Works](#how-this-application-works)
  3. [Prerequisites](#prerequisites)
  4. [Directory Structure](#directory-structure)
  5. [Backend (API)](#backend-api)
     - [Configuration](#configuration)
     - [Running Locally](#running-locally)
     - [Tests](#tests)
  6. [Frontend (UI)](#frontend-ui)
     - [Running Locally](#running-locally-1)
     - [Tests](#tests-1)
     - [GitHub Pages Deployment](#github-pages-deployment)
  7. [Docker & Deployment](#docker--deployment)
  8. [Full Stack Deployment Considerations](#full-stack-deployment-considerations)
  9. [Environment Variables](#environment-variables)
  10. [License](#license)

## Overview
`Folds & Flavors` is a sample online store application. It provides product listings, shopping cart, order management, and messaging endpoints. The application is split into:
  - **Frontend**: SPA built with React and Tailwind CSS
  - **Backend API**: ASP.NET Core Web API using EF Core for data access
  - **Database**: SQL Server (Docker)

## How This Application Works

This application is a full-stack solution with three main components:

1. **React Frontend**: A single-page application (SPA) built with React and TypeScript that provides the user interface for the store. This is what gets deployed to GitHub Pages.

2. **ASP.NET Core API**: A RESTful API that handles business logic, data processing, and database operations. It provides endpoints for:
   - Product management
   - Order processing
   - User authentication
   - File uploads
   - Messages and notifications

3. **SQL Server Database**: Stores all application data including products, orders, users, and system logs.

### Architecture Overview:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  React Frontend │──────▶  ASP.NET Core    │──────▶  SQL Server DB  │
│  (TypeScript)   │◀──────  Web API         │◀──────  (Docker)       │
│                 │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

### Data Flow:
1. The React frontend makes HTTP requests to the API endpoints
2. The API processes these requests, performs business logic
3. The API communicates with the database using Entity Framework Core
4. Results are returned to the frontend as JSON responses

### Authentication:
- The application uses JWT (JSON Web Tokens) for authentication
- Tokens are stored in the browser's localStorage
- Protected API endpoints verify the token before processing requests

### Communication:
All communication between the frontend and backend happens via RESTful API calls. The frontend is configured to proxy API requests in development mode or use relative paths in production.

## Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/compose/)

## Directory Structure
```
./
├─ server/            # ASP.NET Core Web API project
│   ├─ Controllers/   # API controllers (Products, Orders, Messages, Auth)
│   ├─ Data/          # EF Core DbContext & models
│   ├─ IntegrationTests/  # API integration tests (xUnit)
│   └─ Program.cs     # Entry point, service registration
├─ src/               # React application
│   ├─ pages/         # Page components (Home, Admin, Contact)
│   ├─ services/      # API service wrappers (productService, etc.)
│   └─ index.tsx      # React entry point
├─ docker-compose.yml # DB + API services
├─ Dockerfile         # Multi-stage build for UI + API
└─ README.md          # This file
```

## Backend (API)
The backend is implemented in `server/`:

### Configuration
- Uses EF Core with SQL Server. Default connection string reads:
  - `DB_SERVER` (default: `db`)
  - `DB_PORT` (default: `1433`)
  - `DB_NAME`   (default: `FAI`)
  - `DB_USER`   (default: `sa`)
  - `DB_PASSWORD` (default: ``)
- Authentication/Authorization has been removed: all endpoints are open.

### Running Locally
```bash
cd server
dotnet run --urls "http://localhost:4000"
```
The API listens on port `4000` by default.

### Tests
Run unit and integration tests via xUnit:
```bash
cd server
dotnet test
```

## Frontend (UI)
The React SPA lives in `src/`.

### Running Locally
```bash
npm install
npm start
```
The UI will launch at http://localhost:3000 and proxy API calls to the backend.

### Tests
React unit tests (Jest):
```bash
npm test
```

### GitHub Pages Deployment

The frontend application is deployed to GitHub Pages and can be accessed at https://vmudinas.github.io/VTS_CRM/. 

**Important Note:** GitHub Pages only hosts the React frontend portion of the application. It does not host the backend API or database since GitHub Pages only supports static content. This means:

- When accessing the application via GitHub Pages, you're only getting the frontend UI
- API calls from the GitHub Pages-hosted frontend will fail unless you're also running the backend API separately
- The GitHub Pages deployment is primarily for demonstration purposes of the UI

Automatic deployment happens via GitHub Actions when changes are pushed to the main branch. The workflow is defined in `.github/workflows/deploy.yml`.

You can also manually trigger the GitHub Actions deployment from the Actions tab in the repository.

Alternatively, deploy manually with:
```bash
npm run deploy
```

This uses the gh-pages package to deploy the build folder to the gh-pages branch.

## Docker & Deployment
The entire app can be run via Docker Compose. First, copy `.env.example` to `.env` and customize your passwords.
```bash
cp .env.example .env
docker-compose up --build -d
```
This brings up:
- `db` service: SQL Server (port 1433)
- `api` service: UI + API combined (port 4000)

To rebuild only the API (includes UI build):
```bash
docker-compose build api
docker-compose up -d api
```
  
**Data Persistence**

The SQL Server data is stored in a Docker named volume (`mssql-data`) defined in `docker-compose.yml`. Rebuilding or restarting the containers will not erase your data. To completely remove and reset the database (and lose all data), run:
```bash
docker-compose down -v
docker volume rm mssql-data
```

## Full Stack Deployment Considerations

### GitHub Pages Limitation

GitHub Pages **cannot** host dynamic server-side applications like:
- Docker containers
- SQL Server or any database (including PostgreSQL)
- ASP.NET Core API or any backend server

GitHub Pages is a static file hosting service only, suitable for frontend applications built with HTML, CSS, and JavaScript.

**Note on PostgreSQL:** This application is configured to use SQL Server by default, not PostgreSQL. However, the principle remains the same - GitHub Pages cannot host any database system. If you prefer PostgreSQL, you would need to modify the backend code and deploy it to a server that supports PostgreSQL.

### Options for Full Stack Deployment

To deploy the complete application with working frontend, API and database, you would need:

#### Option 1: Cloud Service Providers
- **Frontend**: Continue using GitHub Pages
- **Backend & Database**: Deploy to a cloud service like:
  - Azure App Service + Azure SQL Database
  - AWS Elastic Beanstalk + RDS
  - Google Cloud Run + Cloud SQL
  - Heroku with a PostgreSQL add-on

#### Option 2: Docker-Based Hosting
- Deploy the entire Docker Compose setup to:
  - Digital Ocean with Docker support
  - AWS ECS (Elastic Container Service)
  - Azure Container Instances
  - Google Cloud Run

#### Option 3: Self-Hosted
- **Frontend**: Can still use GitHub Pages
- **Backend & Database**: Deploy to your own server (VPS, dedicated server, or on-premises hardware)
  - Configure proper networking and security
  - Set up a domain name and SSL certificates
  - Configure reverse proxy (Nginx/Apache) for the API

### Connecting Frontend to Backend in Production

For the deployed GitHub Pages frontend to communicate with a separately hosted backend:

1. Set up CORS on the backend to allow requests from the GitHub Pages domain
2. Update the API service in the frontend to point to your deployed API URL
3. Ensure your API is accessible via HTTPS for security

### Development vs. Production

- **Development**: Use the local Docker Compose setup or run components separately
- **Production**: Choose one of the deployment options above based on your requirements and budget

## Environment Variables
- Copy `.env.example` to a `.env` file in the project root, then set your passwords:
  - `SA_PASSWORD` – Strong password for SQL Server (must satisfy complexity requirements).
  - `DB_PASSWORD` – Password the API uses to connect (you can reuse `SA_PASSWORD`).
  - `JWT_SECRET` – Secret key for signing JWT tokens.
  - `ASPNETCORE_URLS` – URL(s) the API should listen on (e.g. `http://+:4000`).
  - `ADMIN_USERNAME` – Default admin username to seed initial admin account (optional).
  - `ADMIN_PASSWORD` – Default admin password to seed initial admin account (optional).

## License
MIT

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

