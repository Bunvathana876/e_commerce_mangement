# 🐼 Blue Panda — Management Portal & Seller Center

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Tests-62%20Passing-success?style=for-the-badge&logo=node.js&logoColor=white)](./src/lib/__tests__)

The **Blue Panda Management Portal** is a high-performance, enterprise-grade administrative and multi-tenant seller dashboard built for the Blue Panda E-Commerce ecosystem. It provides administrators and merchant partners with comprehensive operational capabilities, including Point of Sale (POS), real-time inventory tracking, order fulfillment, financial reporting, and store management.

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
  - [1. Admin Management Portal](#1-admin-management-portal)
  - [2. Point of Sale (POS) Terminal](#2-point-of-sale-pos-terminal)
  - [3. Seller Center (Multi-Tenant Partner Portal)](#3-seller-center-multi-tenant-partner-portal)
  - [4. Security & Role Isolation](#4-security--role-isolation)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Local Run](#installation--local-run)
- [Docker Deployment](#-docker-deployment)
- [Available Scripts](#-available-scripts)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [System Architecture & Network Ports](#-system-architecture--network-ports)
- [Contributing & License](#-contributing--license)

---

## 🏛 Overview & Architecture

The Blue Panda E-Commerce platform follows a decoupled architecture where the administrative and merchant operations are completely separated from the customer-facing storefront:

```text
                      ┌───────────────────────────────────────────┐
                      │          Blue Panda Ecosystem             │
                      └─────────────────────┬─────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │                            │                            │
      ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
      │   Storefront    │          │   Management    │          │   Mobile App    │
      │   (Next.js 16)  │          │   Portal (This) │          │ (Flutter/Dart)  │
      │    Port 3000    │          │    Port 3001    │          │     Client      │
      └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
               │                            │                            │
               └────────────────────┬───────┴────────────────────────────┘
                                    │ Client REST API Requests
                           ┌────────▼────────┐
                           │ FastAPI Backend │
                           │    Port 8000    │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │  PostgreSQL 16  │
                           │    Database     │
                           └─────────────────┘
```

---

## ✨ Key Features

### 1. Admin Management Portal (`/admin`)
- **Executive Dashboard (`/admin/dashboard`):** Real-time store performance metrics, live order counters, revenue tracking, low-stock/out-of-stock alerts, and activity timelines.
- **Product & Catalog Management (`/admin/products`, `/admin/categories`):** Full CRUD for product listings, pricing, category taxonomy, SKU assignments, and visual asset linking.
- **Inventory & Supply Chain (`/admin/inventory`, `/admin/suppliers`):** Stock movement logging, low-stock threshold monitoring, and supplier contact directory.
- **Order Management & Fulfillment (`/admin/orders`):** Comprehensive order pipeline management across statuses (`pending`, `processing`, `delivered`, `cancelled`).
- **Financial Control Center (`/admin/payments`, `/admin/transactions`, `/admin/refunds`):** Multi-method transaction ledger, refund processing, and dispute reconciliation.
- **Customer & Review Moderation (`/admin/customers`, `/admin/reviews`):** Customer profile inspection, purchase history auditing, and product review management.
- **Business Intelligence & Reporting (`/admin/reports`, `/admin/analytics`):** Sales analysis, category trends, transaction breakdowns, and downloadable summaries.
- **System Administration (`/admin/employees`, `/admin/roles`, `/admin/settings`):** Role-based access control (RBAC), team member management, and portal configuration.

### 2. Point of Sale (POS) Terminal (`/admin/pos`)
- **High-Speed Cashier Interface:** Optimized for physical checkout with instant barcode search, category filtering, and responsive item addition.
- **Parked Carts:** Suspend and resume multiple customer transactions simultaneously without losing selected items.
- **Thermal Receipt Printing:** Generates print-ready receipts supporting both standard **80mm** and compact **58mm** formats with embedded SVG barcodes.
- **Flexible Payments & Discounts:** Supports Cash, Credit Card, and QR code payments, along with coupon code validation and custom discounts.

### 3. Seller Center (Multi-Tenant Partner Portal) (`/seller`)
- **Partner Dashboard (`/seller`):** Tailored dashboard displaying seller-scoped sales metrics and performance indicators.
- **Isolated Catalog Management (`/seller/products`):** Dedicated product management scoped strictly to the authenticated seller's inventory.
- **Store Profile Self-Service (`/seller/store`):** Merchant management for business details, brand logo, contact information, and store bio.
- **Privilege Enforcement:** Status-aware interface disabling management features for pending or suspended seller accounts.

### 4. Security & Role Isolation
- **Strict Role-Based Routing:** Automated route protection isolating `admin`, `seller`, and `customer` paths.
- **Decoupled Session Persistence:** Uses dedicated `mgmt_*` storage keys (`mgmt_accessToken`, `mgmt_currentUser`, `mgmt_isLoggedIn`), completely preventing token collision or session pollution with public storefront visitors.
- **Anti-Tampering Defenses:** Protection against open redirects (`//`, `/\`), cross-app origin verification, and automatic session epoch advancement on logout or account switching.
- **Automatic Expiration Handling:** Proactive JWT expiration detection with grace buffer to prevent unauthorized requests.

---

## 💻 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React Compiler) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS |
| **Icons & UI** | [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/) |
| **Utilities** | `clsx`, `tailwind-merge`, `@svgr/webpack` |
| **Testing** | Node.js Built-in Test Runner (`--experimental-strip-types`) |
| **Containerization** | Docker (Alpine Node 20 runtime) |

---

## 📁 Project Structure

```text
management/
├── .env.example              # Environment variables template
├── Dockerfile                # Production / Dev container definition
├── eslint.config.mjs         # ESLint configuration
├── next.config.ts            # Next.js build & image domain configuration
├── package.json              # Project scripts and dependencies
├── postcss.config.mjs        # PostCSS configuration for Tailwind v4
├── tsconfig.json             # TypeScript compiler settings
├── public/                   # Static assets, logos, and icons
└── src/
    ├── app/                  # Next.js App Router root
    │   ├── (admin)/          # Admin Portal sub-tree
    │   │   └── admin/        # Dashboard, POS, Products, Orders, Finance, etc.
    │   ├── (auth)/           # Authentication layout and login/register pages
    │   ├── (seller)/         # Multi-tenant Seller Center sub-tree
    │   │   └── seller/       # Seller dashboard, products, store profile
    │   ├── globals.css       # Tailwind v4 theme, variables, and animations
    │   ├── layout.tsx        # Top-level HTML layout
    │   └── page.tsx          # Smart root role router (redirects by auth state)
    ├── components/           # Reusable UI component library
    │   ├── layout/           # Admin sidebar, top navbar, dashboard layout
    │   └── seller/           # Seller sidebar, navbar, seller portal layout
    └── lib/                  # Core client utilities and business logic
        ├── api.ts            # Typed REST API client for FastAPI backend
        ├── auth.ts           # Session manager, token validation, role guards
        ├── utils.ts          # Class merging and string formatting utilities
        └── __tests__/        # Unit and integration test suite
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** `v20.x` or higher
- **npm:** `v10.x` or higher
- **Blue Panda Backend:** FastAPI server running on `http://localhost:8000` (optional for frontend development with mock data)

### Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Configure your environment variables in `.env.local`:

```ini
# Backend FastAPI REST endpoint
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Public customer storefront URL for cross-app linking
NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
```

### Installation & Local Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Access the portal:**
   Open [http://localhost:3001](http://localhost:3001) in your browser.
   - You will be greeted by the portal router and redirected to `/login` if unauthenticated.
   - Logging in with an **admin** account will direct you to `/admin/dashboard`.
   - Logging in with a **seller** account will direct you to `/seller`.

---

## 🐳 Docker Deployment

The application includes an optimized, production-ready `Dockerfile` built on Node 20 Alpine.

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t bluepanda-management .

# Run container on port 3001
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000/api \
  -e NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000 \
  bluepanda-management
```

### Running with Docker Compose

When running as part of the full root stack in the main repository:

```bash
docker compose up -d ecommerce-management
```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server on `0.0.0.0:3001` |
| `npm run build` | Compiles and builds the production application with Webpack fallback |
| `npm run start` | Launches the built production server on `0.0.0.0:3001` |
| `npm run lint` | Runs ESLint to verify code style and detect lint errors |
| `npm test` | Runs the full Node.js native test suite with TypeScript stripping |

---

## 🧪 Testing & Quality Assurance

The codebase includes an automated test suite verifying session isolation, post-auth role routing, seller catalog scoping, and security boundaries.

Run tests with:

```bash
npm test
```

### Test Coverage Highlights
- **Management Portal Session & Role Isolation:** Validates dedicated localStorage key isolation, preventing admin/seller sessions from leaking into customer storefront state.
- **Role Routing & Redirection:** Tests post-login target path resolution, privilege boundary clamping, and anti-open-redirect sanitization.
- **Seller Store & Product Logic:** Validates store profile payload validation, field protection against unauthorized tampering, and seller status gating.

---

## 🌐 System Architecture & Network Ports

| Service | Address | Description |
| :--- | :--- | :--- |
| **Management Portal** | `http://localhost:3001` | Admin dashboard, POS, and Seller Center *(This repository)* |
| **Customer Storefront** | `http://localhost:3000` | Customer-facing browsing, cart, and checkout |
| **Backend API** | `http://localhost:8000` | FastAPI REST services and OpenAPI documentation (`/docs`) |
| **PostgreSQL Database** | `localhost:5433` (Docker: 5432) | Primary relational database storage |
| **pgAdmin 4** | `http://localhost:5050` | Database management and querying interface |

---

## 🤝 Contributing & License

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

This project is part of the **Blue Panda E-Commerce Platform** and is proprietary software. All rights reserved.
