# WARE2DOOR

WARE2DOOR is a React-based logistics and delivery management portal. It provides separate dashboards for warehouses, transit hubs, local agencies, admin teams, and super administrators, along with public tools for shipment tracking, customer support, FAQs, password recovery, and ticket creation.

## Features

### Public Portal

- Landing page for the WARE2DOOR platform
- User login and logout
- Forgot-password workflow with email verification and OTP reset
- Shipment tracking
- Customer information and support pages
- FAQ section
- Support ticket creation
- Tracking ID validation
- Responsive user interface

### Role-Based Dashboards

Authenticated users are routed to dashboards based on their account role:

- **Warehouse**
  - Inventory management
  - Order processing
  - Shipment and RTO management
  - Warehouse operational views

- **Transit Hub**
  - Package scanning
  - Inbound and outbound shipment management
  - Transit hub operations

- **Local Agency**
  - Shipment delivery workflows
  - Agent and order management
  - Local agency operations

- **Admin Teams**
  - Administrative operations
  - Warehouse, transit hub, and agency analytics
  - Management tools and reporting

- **Super Admin**
  - Platform-wide monitoring
  - Performance dashboards
  - Cross-organization metrics

## Technology Stack

- **React 18**
- **Vite 5**
- **JavaScript**
- **CSS**
- **Chart.js**
- **React DOM**
- **Font Awesome**
- **Google Fonts**
  - Poppins
  - Inter

## Project Structure

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── src/
    ├── auth/
    │   └── AuthContext.jsx
    ├── config.js
    ├── landing/
    │   ├── api/
    │   ├── app/
    │   ├── assets/
    │   ├── components/
    │   ├── pages/
    │   ├── styles/
    │   └── main.jsx
    ├── warehouse/
    │   ├── api/
    │   ├── app/
    │   ├── assets/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   ├── styles/
    │   └── utils/
    ├── transit-hub/
    │   ├── api/
    │   ├── app/
    │   ├── assets/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   ├── styles/
    │   └── utils/
    ├── local-agency/
    │   ├── api/
    │   ├── app/
    │   ├── assets/
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/
    │   ├── styles/
    │   └── utils/
    ├── adminteams/
    │   ├── api/
    │   ├── app/
    │   ├── components/
    │   ├── pages/
    │   ├── styles/
    │   └── utils.js
    ├── superadmin/
    │   ├── api/
    │   ├── app/
    │   ├── components/
    │   ├── pages/
    │   └── styles/
    └── utils/
        ├── dataExport.js
        └── inputValidation.js
```

## Application Flow

The application starts from `src/landing/main.jsx`, which renders the main React application into the `root` element defined in `index.html`.

`src/landing/app/App.jsx` manages the public pages and authenticated portals. After authentication, users are directed to the appropriate dashboard based on their role:

```text
WAREHOUSE      → WarehouseApp
TRANSIT_HUB    → TransitHubApp
LOCAL_AGENCY   → LocalAgencyApp
ADMIN_TEAMS    → AdminTeamsApp
SUPER_USER     → SuperAdminApp
```

Authenticated modules are loaded lazily to keep the initial application bundle smaller. Public and dashboard-specific stylesheets are loaded dynamically depending on the active route and user role.

## Authentication

Authentication is managed by `AuthProvider` in:

```text
src/auth/AuthContext.jsx
```

The authentication system:

- Sends login requests to the backend
- Stores session data in `localStorage`
- Validates existing sessions on application startup
- Supports role-based access
- Handles session expiration
- Synchronizes authentication changes between browser tabs
- Provides login and logout helpers through the `useAuth` hook

Supported roles:

```text
WAREHOUSE
TRANSIT_HUB
LOCAL_AGENCY
ADMIN_TEAMS
SUPER_USER
```

## API Configuration

The frontend uses the `VITE_API_BASE` environment variable to configure the backend API URL.

If the variable is not provided, the application uses:

```text
http://127.0.0.1:8000
```

Create a `.env` file in the project root when using a different backend URL:

```env
VITE_API_BASE=http://localhost:8000
```

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 18 or newer
- npm
- A running WARE2DOOR backend API

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Rag-2007/FDFED-REACT.git
cd FDFED-REACT
npm install
```

### Configure the API

Create a `.env` file in the project root:

```env
VITE_API_BASE=http://127.0.0.1:8000
```

Update the URL if your backend is running elsewhere.

### Start the Development Server

```bash
npm run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

### Create a Production Build

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Vite development server |
| `npm run build` | Creates an optimized production build |
| `npm run preview` | Serves the production build locally |

## Validation and Data Utilities

Reusable validation helpers are located in:

```text
src/utils/inputValidation.js
```

They support validation for:

- Tracking IDs
- RTO IDs
- Shipment labels
- Email addresses
- Phone numbers
- Required text fields
- Positive numeric values

The application also provides CSV export and printable report functionality through:

```text
src/utils/dataExport.js
```

These utilities include:

- CSV generation and download
- Formula-injection protection for exported CSV values
- Printable HTML reports
- HTML escaping for report content

## Analytics

Admin and super-admin dashboards use Chart.js to display operational metrics such as:

- Warehouse inventory
- Pending orders
- RTO counts
- Transit hub inbound and outbound scans
- Hub capacity
- Agency deliveries
- RTO requests
- Active agents

## Backend Requirements

The frontend expects a backend API that provides authentication and logistics-related endpoints, including routes for:

- User login
- Session validation
- User logout
- Password recovery
- Shipment tracking
- Tracking ID validation
- Support ticket creation
- Dashboard data
- Role-specific operational actions

The backend should be available at the URL configured by `VITE_API_BASE`.

## Development Notes

- The application uses Vite for development and production builds.
- Authentication tokens are sent using the `Authorization: Bearer <token>` header.
- API requests include credentials for cookie-based session support.
- Do not commit secrets, production API keys, or private environment variables.

## License

No license has been specified for this repository yet.
