
# Folds & Flavors (My Store)

Full-stack web application featuring:
  - React frontend (TypeScript)
  - ASP.NET Core 9 backend API with Entity Framework Core
  - SQL Server database (via Docker)
  - Fully containerized via Docker Compose
  - Deployed to GitHub Pages at https://vmudinas.github.io/VTS_CRM/

## Table of Contents
  1. [Overview](#overview)
  2. [Prerequisites](#prerequisites)
  3. [Directory Structure](#directory-structure)
  4. [Backend (API)](#backend-api)
     - [Configuration](#configuration)
     - [Running Locally](#running-locally)
     - [Tests](#tests)
  5. [Frontend (UI)](#frontend-ui)
     - [Running Locally](#running-locally-1)
     - [Tests](#tests-1)
     - [GitHub Pages Deployment](#github-pages-deployment)
  6. [Docker & Deployment](#docker--deployment)
  7. [Environment Variables](#environment-variables)
  8. [License](#license)

## Overview
`Folds & Flavors` is a sample online store application. It provides product listings, shopping cart, order management, and messaging endpoints. The application is split into:
  - **Frontend**: SPA built with React and Tailwind CSS
  - **Backend API**: ASP.NET Core Web API using EF Core for data access
  - **Database**: SQL Server (Docker)

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

