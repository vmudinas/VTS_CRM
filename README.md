
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
  10. [Payment Methods Configuration](#payment-methods-configuration)
  11. [License](#license)

## Overview
`VTS Capital Management` is a CRM system for property management and IT consultancy services. It provides service listings, client management, order processing, and messaging endpoints. The application is split into:
  - **Frontend**: SPA built with React and Tailwind CSS
  - **Backend API**: ASP.NET Core Web API using EF Core for data access
  - **Database**: SQL Server (Docker)

## How This Application Works

This application is a full-stack solution with three main components:

1. **React Frontend**: A single-page application (SPA) built with React and TypeScript that provides the user interface for the CRM system. This is what gets deployed to GitHub Pages.

2. **ASP.NET Core API**: A RESTful API that handles business logic, data processing, and database operations. It provides endpoints for:
   - Service management
   - Client and project management
   - User authentication
   - File uploads
   - Messages and notifications

3. **SQL Server Database**: Stores all application data including services, clients, projects, users, and system logs.

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

## Payment Methods Configuration

The application supports multiple payment methods that require specific configuration to work correctly in production environments:

### Apple Pay (Stripe Payment Request API)

To configure Apple Pay with Stripe:

1. **Stripe Account Setup**:
   - Create a [Stripe account](https://stripe.com/docs/development)
   - Obtain a Stripe publishable key and secret key

2. **Environment Variables**:
   - Add to your `.env` file:
     ```
     REACT_APP_STRIPE_PUBLISHABLE_KEY=your_publishable_key
     ```

3. **Apple Developer Account Requirements**:
   - Register as an Apple Developer
   - Configure your domain in the [Apple Developer Portal](https://developer.apple.com/)
   - Generate and download a merchant identity certificate

4. **Domain Verification**:
   - Add Apple Pay domain association file to your website's `.well-known` directory
   - Verify your domain with Apple

5. **Stripe Dashboard Configuration**:
   - Add your domain to the list of approved domains in Stripe Dashboard
   - Upload your Apple merchant identity certificate to Stripe

### PayPal

To set up PayPal payments:

1. **PayPal Developer Account**:
   - Create a [PayPal Developer account](https://developer.paypal.com/)
   - Create a PayPal application to get client ID and secret

2. **Environment Variables**:
   - Add to your `.env` file:
     ```
     REACT_APP_PAYPAL_CLIENT_ID=your_client_id
     ```

3. **Configure PayPal SDK**:
   - The application is already set up to use the PayPal JavaScript SDK
   - Update the `PAYPAL_CLIENT_ID` in `src/components/payment/PayPalButton.tsx` with your actual client ID (or use the environment variable)

4. **Webhooks (Optional)**:
   - For production, configure webhooks in the PayPal Developer Dashboard
   - Set up endpoints to receive payment event notifications
   - Update the backend API to handle these webhook events

### Zelle

Zelle integration requires manual setup since Zelle doesn't provide a direct API:

1. **Zelle Business Account**:
   - Register for a [Zelle Business Account](https://www.zellepay.com/business)
   - Ensure your business bank supports Zelle

2. **Configuration**:
   - Update the email and phone number in `src/components/payment/ZelleInstructions.tsx` with your actual Zelle-registered information

3. **Backend Implementation**:
   - Add an API endpoint in your backend to verify and process Zelle payments
   - Implement a database table to track Zelle payment references
   - Update the `confirmZellePayment` function in `src/context/PaymentContext.tsx` to call your backend API

4. **Manual Verification Process**:
   - Set up a process to manually verify Zelle payments against your bank account
   - Consider implementing an admin dashboard for payment reconciliation

### Cryptocurrency Payments

To enable cryptocurrency payments:

1. **Wallet Setup**:
   - Create wallets for each cryptocurrency you want to accept
   - Generate static addresses or integrate with an API for dynamic address generation

2. **Configuration**:
   - Update the example crypto address in the `Donate.tsx` component with your actual wallet addresses
   - If supporting multiple cryptocurrencies, extend the `cryptoType` options in `CryptoPayment.tsx`

3. **Payment Verification**:
   - Implement a backend service to monitor blockchain transactions
   - Connect to blockchain nodes or use a third-party service like [BlockCypher API](https://www.blockcypher.com/dev/) or [Coinbase Commerce](https://commerce.coinbase.com/)

4. **Environment Variables**:
   - Add to your `.env` file:
     ```
     REACT_APP_BTC_ADDRESS=your_bitcoin_address
     REACT_APP_ETH_ADDRESS=your_ethereum_address
     # Add more for other cryptocurrencies as needed
     ```

5. **Optional: Third-Party Services**:
   - Consider integrating with services like BitPay, Coinbase Commerce, or CoinGate for easier cryptocurrency payment processing
   - Update the `trackPayment` function in `PaymentContext.tsx` to communicate with these services

### Security Considerations for All Payment Methods

1. **SSL/TLS Encryption**:
   - Ensure your website uses HTTPS
   - Obtain and configure an SSL certificate for your domain

2. **PCI Compliance**:
   - When handling credit card information, ensure PCI DSS compliance
   - Stripe and PayPal handle most PCI compliance requirements automatically

3. **Data Protection**:
   - Implement proper data encryption for sensitive information
   - Follow GDPR and other regional data protection regulations

4. **Testing**:
   - Always test payments in sandbox/test mode before going live
   - Each payment provider offers test credentials for development

For further assistance with payment integration, consult each platform's developer documentation.

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

