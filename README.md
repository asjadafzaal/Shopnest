# ShopNest — Multi-Vendor Marketplace Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2+-092E20?style=flat-square&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-3.16+-red?style=flat-square)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0_Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](http://127.0.0.1:8000/api/docs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A modern, full-stack multi-vendor e-commerce marketplace platform built with **Django REST Framework**, **PostgreSQL**, and **React 19 + Vite**.

ShopNest enables independent sellers to create vetted storefronts, manage products with dynamic JSON specifications, and track order fulfillment, while providing customers with a unified multi-store shopping cart and atomic split-checkout experience.

---

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. PostgreSQL Database Setup](#2-postgresql-database-setup)
  - [3. Backend Setup (Django)](#3-backend-setup-django)
  - [4. Seed Demo Data](#4-seed-demo-data)
  - [5. Frontend Setup (React + Vite)](#5-frontend-setup-react--vite)
- [Demo Credentials](#demo-credentials)
- [Seller Onboarding Workflow](#seller-onboarding-workflow)
- [API Documentation & Swagger](#api-documentation--swagger)
- [Core API Endpoints](#core-api-endpoints)
- [Running Automated Tests](#running-automated-tests)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### 🛍️ Unified Cart & Atomic Split Orders
- **Multi-Store Cart**: Customers can seamlessly add items from multiple independent vendors into a single shopping cart.
- **Atomic Order Splitting**: Checkout automatically creates one master `Order` for the customer and splits items into isolated `SellerOrder` records per vendor.
- **Immutable Snapshots**: Each `OrderItem` permanently captures the product name, SKU, and unit price at checkout time, ensuring accounting integrity.

### 🛡️ Concurrency & Stock Integrity
- **Pessimistic Row Locking (`select_for_update()`)**: High-concurrency checkout transactions lock inventory rows to prevent race conditions and overselling.
- **PostgreSQL Database Constraints**: Database-enforced `CheckConstraint` rules ensure positive prices, non-negative stock levels, and valid 1–5 star ratings.

### ⚡ PostgreSQL Advanced Capabilities
- **Full-Text Search (FTS)**: Native PostgreSQL `SearchVector`, `SearchQuery`, and `SearchRank` ranking weights over product names and descriptions.
- **Dynamic JSONField Attributes**: Stores flexible specifications (e.g., storage capacity, color, material) with custom dynamic query filtering.

### 🏪 Seller Portal & Storefront Lifecycle
- **Registration & Admin Approval**: Sellers register with automatic `SellerProfile` provisioning; platform administrators review and approve accounts in Django Admin.
- **Store Setup & Branding**: Once approved, sellers launch custom storefronts with branding, logos, and descriptions.
- **Product Management**: Multi-image uploads, category selection, price/inventory controls, and dynamic spec builders.
- **Seller Analytics**: Real-time sales metrics, revenue summaries, fulfillment breakdown, and best-selling product rankings using Django ORM aggregations.

### ⭐ Verified Customer Reviews
- Customers rate and review purchased products (1 to 5 stars).
- The platform automatically verifies purchase history to display a **Verified Purchase** badge.

---

## System Architecture

```text
                      ┌────────────────────────────────────────┐
                      │      React 19 + Vite SPA (:5173)       │
                      │  Custom Vanilla CSS + Lucide Icons     │
                      └──────────────────┬─────────────────────┘
                                         │ Proxy: /api & /media
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    Django 5 REST Framework (:8000)     │
                      │  JWT Authentication & OpenAPI / Swagger │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
 ┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
 │  users App   │                 │ sellers App  │                 │ catalog App  │
 │ Custom User  │                 │ SellerProfile│                 │ Category Tree│
 │ Roles & JWT  │                 │ Store Models │                 │ Product + FTS│
 └──────────────┘                 └──────────────┘                 └──────────────┘
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         ▼
                                  ┌──────────────┐
                                  │  orders App  │
                                  │ Cart / Item  │
                                  │ Multi-Vendor │
                                  │ Split Orders │
                                  └──────┬───────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │             PostgreSQL 16+             │
                      │ - Full-Text Search (tsvector/gin)      │
                      │ - JSONField Querying                   │
                      │ - Pessimistic Row Locking (SELECT FOR  │
                      │   UPDATE in atomic transactions)       │
                      │ - Check Constraints (positive prices,  │
                      │   non-negative stock, rating 1-5)      │
                      └────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | Python 3.11+, Django 5.2+, Django REST Framework 3.18+ |
| **Database** | PostgreSQL 16+ (with `django.contrib.postgres`) |
| **Authentication** | DRF Simple JWT (Access & Refresh tokens) |
| **API Documentation** | `drf-spectacular` (OpenAPI 3.0, Swagger UI, ReDoc) |
| **Frontend UI** | React 19, Vite 6+, React Router 7, Lucide Icons |
| **Styling** | Vanilla CSS Design System with CSS variables and responsive glassmorphism |
| **Testing** | Django TestCase & DRF APITestCase |

---

## Repository Structure

```text
ShopNest/
├── backend/
│   ├── catalog/              # Products, categories, images, FTS, reviews
│   ├── config/               # Django project settings, URLs, WSGI/ASGI
│   ├── orders/               # Shopping cart, split orders, checkout transaction
│   ├── sellers/              # SellerProfile, Store, onboarding & analytics
│   ├── users/                # Custom User model (customer, seller, admin)
│   ├── manage.py
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, Toast, StarRating, ProtectedRoute
│   │   ├── context/          # AuthContext (JWT session management)
│   │   ├── pages/            # Home, Products, ProductDetail, Cart, Checkout,
│   │   │                     # Orders, OrderDetail, SellerDashboard, Login, Register
│   │   ├── api.js            # Axios client with JWT auto-refresh interceptors
│   │   ├── App.jsx           # Application routes
│   │   ├── index.css         # Global design system & utility classes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js        # Vite dev server with proxy to backend :8000
├── .gitignore                # Clean open-source ignore rules
├── LICENSE                   # MIT License
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your machine:
- **Python** (version 3.11 or higher)
- **Node.js** (version 18 or higher) and **npm**
- **PostgreSQL** (version 16 or higher) running locally on port `5432`
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ShopNest.git
cd ShopNest
```

---

### 2. PostgreSQL Database Setup

Open your terminal or `psql` console and create the database:

```sql
CREATE DATABASE shopnest;
```

---

### 3. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   # On Windows
   copy .env.example .env

   # On macOS / Linux
   cp .env.example .env
   ```
   *Edit `.env` to match your local PostgreSQL credentials (e.g., `DB_PASSWORD`).*

5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

---

### 4. Seed Demo Data

ShopNest includes a comprehensive seeding command that provisions categories, demo seller accounts, active stores, products with dynamic JSON attributes, and verified reviews:

```bash
python manage.py seed_data
```

Start the Django development server:
```bash
python manage.py runserver 8000
```
*The API will be available at `http://127.0.0.1:8000/`.*

---

### 5. Frontend Setup (React + Vite)

1. Open a **new terminal window** and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```
   *The application will open at `http://localhost:5173/`.*

---

## Demo Credentials

The `seed_data` command automatically provisions ready-to-use demo accounts:

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin` | `admin123456` | Full Django Admin portal at `/admin/` |
| **Seller 1 (Electronics)** | `techseller` | `SellerPass123!` | Store: **TechZone Direct** |
| **Seller 2 (Apparel)** | `fashionseller` | `SellerPass123!` | Store: **UrbanWear Studio** |
| **Seller 3 (Home & Living)**| `homeseller` | `SellerPass123!` | Store: **Nordic Home** |
| **Seller 4 (Sporting)** | `sportseller` | `SellerPass123!` | Store: **Apex Athletics** |
| **Customer** | `testcustomer` | `TestPass123!` | Customer account with pre-seeded cart & orders |

---

## Seller Onboarding Workflow

ShopNest implements a 4-step seller lifecycle:

1. **Registration**: A user registers selecting the `seller` role. A `SellerProfile` is automatically created with `approval_status="pending"`.
2. **Admin Review**: Platform administrators review pending sellers in the Django Admin (`/admin/sellers/sellerprofile/`) and set status to `Approved`.
3. **Store Launch**: The approved seller logs into the frontend, is greeted by the Store Creation wizard, and enters their store name and description.
4. **Catalog Management**: The seller lists products, uploads images, sets inventory, and processes multi-vendor split orders in their dedicated Seller Dashboard.

---

## API Documentation & Swagger

Interactive API documentation is automatically generated by `drf-spectacular`:

- **Swagger UI**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)
- **ReDoc**: [http://127.0.0.1:8000/api/docs/redoc/](http://127.0.0.1:8000/api/docs/redoc/)
- **Raw OpenAPI Schema**: [http://127.0.0.1:8000/api/schema/](http://127.0.0.1:8000/api/schema/)

---

## Core API Endpoints

### 🔐 Authentication (`/api/auth/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Register customer or seller account |
| `POST` | `/api/auth/login/` | Obtain JWT access + refresh tokens |
| `POST` | `/api/auth/token/refresh/` | Refresh expired access token |
| `GET` | `/api/auth/profile/` | Current user profile |
| `PUT` | `/api/auth/profile/` | Update user profile |

### 🏬 Sellers & Stores (`/api/sellers/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sellers/stores/` | Public directory of approved stores |
| `GET` | `/api/sellers/stores/<slug>/` | Storefront details & seller catalog |
| `GET` | `/api/sellers/onboarding-status/`| Current seller approval & store status |
| `GET` / `POST` | `/api/sellers/store/` | Retrieve or create authenticated seller's store |
| `GET` | `/api/sellers/analytics/` | Real-time sales, revenue, and KPI analytics |
| `GET` | `/api/sellers/orders/` | Seller's isolated sub-orders (`SellerOrder`) |
| `PATCH`| `/api/sellers/orders/<id>/status/`| Update order status (`pending` → `delivered`) |

### 📦 Catalog & Search (`/api/catalog/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/catalog/categories/` | List categories (`?tree=true` for nested tree) |
| `GET` | `/api/catalog/products/` | Products with FTS (`?search=...`), categories, specs |
| `GET` | `/api/catalog/products/<slug>/` | Product details with specifications and reviews |
| `GET` / `POST` | `/api/catalog/products/<slug>/reviews/` | Reviews with verified purchase badge |
| `GET` / `POST` | `/api/catalog/seller/products/` | Seller product listing and management |
| `POST` | `/api/catalog/seller/products/<id>/images/` | Upload product gallery images |

### 🛒 Cart & Checkout (`/api/cart/` & `/api/orders/`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cart/` | View current user's multi-vendor shopping cart |
| `POST` | `/api/cart/items/` | Add product to cart with live inventory check |
| `PATCH` / `DELETE`| `/api/cart/items/<id>/` | Modify item quantity or remove from cart |
| `POST` | `/api/orders/checkout/` | Atomic split checkout with pessimistic row locking |
| `GET` | `/api/orders/` | Customer order history |
| `GET` | `/api/orders/<id>/` | Order details with breakdown by vendor store |

---

## Running Automated Tests

Run the backend test suite verifying database constraints, authentication, atomic checkout transactions, and search:

```bash
cd backend
python manage.py test users sellers catalog orders
```

Expected result:
```text
Ran 21 tests in ...s
OK (21 passed, 0 failed, 0 errors)
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository.
2. **Create a branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push** to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** describing your changes.

---

## License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
