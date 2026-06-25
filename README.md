# Backend Internship Assignment: Quote Analysis Service

A production-ready, high-performance Backend Service built with **Node.js, TypeScript, Express.js, Drizzle ORM, and SQLite**, utilizing clean, layered architecture. It integrates with a document analysis service to evaluate project quotes and identify missing requirements.

---

## 🚀 Key Features

* **Clean Architecture**: Clean separation of concerns through layers (Controllers, Services, Repositories, Database Schema).
* **Robust DB Layer**: Implemented using **Drizzle ORM** with SQLite, supporting automated schema generation and programmatic migrations.
* **Input Validation**: Strict request payload validation using **Zod** schemas.
* **FastAPI Integration**: Dynamic integration with FastAPI for quote risk analysis, featuring a mock fallback system when the FastAPI microservice is offline, and a strict verification routine to catch malformed responses.
* **Standardized Error Handling**: Centralized error middleware returning consistent JSON errors for database, validation, external API, and internal errors.
* **Request Tracing**: Middleware appending a unique Request UUID to all requests and responses, tracked inside custom Morgan log outputs.
* **Interactive API Documentation**: Live, interactive API docs served under `/api/docs` using **Swagger UI**.
* **Postman Support**: Ready-to-import Postman Collection JSON included at the project root.
* **Dockerized Setup**: Clean `docker-compose` setup hosting both the TypeScript backend and an inline-mock Python FastAPI service for instant end-to-end local evaluation.
* **Testing Suite**: Fully configured Unit Testing suite using **Jest** and **ts-jest**.

---

## 📂 Project Directory Structure

```text
src/
├── controllers/          # Controller Layer (HTTP Request parsing / Response handling)
│   └── quote.controller.ts
├── routes/               # Express Routing Layer
│   └── quote.routes.ts
├── services/             # Service Layer (Pure Business Logic)
│   └── quote.service.ts
├── repositories/         # Data Access Layer (Repository Pattern)
│   ├── quote.repository.ts
│   └── analysis.repository.ts
├── db/                   # Database Configuration & Drizzle Migrations
│   ├── index.ts          # better-sqlite3 database initialization
│   ├── schema.ts         # Drizzle Schema Definitions
│   └── migrate.ts        # Programmatic Migration Runner
├── middleware/           # Custom Express Middlewares
│   ├── error.ts          # Centralized Error Middleware
│   ├── request-id.ts     # Request ID UUID Injector
│   └── validation.middleware.ts # Reusable Zod Validation Middleware
├── validations/          # Zod Validation Schemas
│   └── quote.validation.ts
├── utils/                # Project Utility Functions & Assets
│   ├── errors.ts         # Custom Application Errors
│   └── swagger.json      # OpenAPI / Swagger Specification
├── types/                # Core TypeScript Interface Definitions
│   └── index.ts
├── app.ts                # App configurations (Cors, Morgan, Routes, Docs)
└── server.ts             # Application bootstrapper
tests/                    # Test Suite
├── quote.service.spec.ts # Unit tests for QuoteService
└── validation.spec.ts    # Unit tests for Zod schemas
```

---

## ⚙️ Environment Variables

A `.env` template is provided at the root:

```env
PORT=5000
DATABASE_URL=sqlite.db
FASTAPI_URL=http://localhost:8000
```

---

## 🛠️ Setup & Local Installation

### Prerequisites

* [Node.js](https://nodejs.org/) (v20+ recommended)
* NPM

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Drizzle Migrations
Translate the schema definition inside `src/db/schema.ts` into raw SQL migrations inside `./drizzle/`:
```bash
npm run db:generate
```

### 3. Run Migrations
Apply the generated SQL migrations onto the SQLite database (`sqlite.db`):
```bash
npm run db:migrate
```

*(Note: On initial boot, if the database has zero records, the server will auto-populate with 4 sample quotes for testing convenience).*

### 4. Start the Application
Run the local development server with live watch-mode:
```bash
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000).
Swagger docs will be served at [http://localhost:5000/api/docs](http://localhost:5000/api/docs).

### 5. Running Tests
Run the unit test suite:
```bash
npm test
```

---

## 🐳 Running with Docker

You can spin up the full setup using Docker Compose. The setup builds the Node backend and boots a helper Python FastAPI container mock automatically, resolving all integration dependencies.

```bash
docker-compose up --build
```

---

## 📖 API Documentation

### Interactive Swagger Docs
Open your browser and navigate to [http://localhost:5000/api/docs](http://localhost:5000/api/docs) to access interactive documentation.

### Summary of Endpoints

| Method | Endpoint | Description | Payloads / Parameters |
| :--- | :--- | :--- | :--- |
| **GET** | `/health` | Server status check | None |
| **POST** | `/api/quotes` | Create a quote request | Body: `{ customer: string, project: string, estimatedValue: number }` |
| **GET** | `/api/quotes` | Retrieve quotes (with search & pagination) | Query: `customer`, `project`, `page`, `limit` |
| **GET** | `/api/quotes/:id` | Get quote + analysis results | Path Param: `:id` |
| **PATCH** | `/api/quotes/:id/status` | Update quote status | Body: `{ status: 'New' \| 'In Review' \| 'Needs Info' \| 'Completed' }` |
| **POST** | `/api/quotes/:id/analyze` | Perform document analysis | Path Param: `:id`, Query (optional): `forceLive=true` |

---

## 🏛️ Design Decisions

### Layered Clean Architecture
The codebase strictly decouples responsibility using layers:
1. **Controllers**: Act as HTTP delivery mechanisms. They do not communicate with the database directly. They only parse inputs, call services, and structure HTTP responses.
2. **Services**: Contain pure business logic. They do not know about HTTP requests, headers, or query parameters.
3. **Repositories**: Enforce the **Repository Pattern**, isolating queries and mutations. The service layer consumes repository methods, meaning the underlying ORM or database engine can be swapped with zero changes to business logic.
4. **Domain Types**: Centralized types in `src/types/index.ts` represent the domain, keeping interfaces independent of the database library.

### Resilient FastAPI Call & Fallback
The `analyzeQuote` service function is built for production reliability:
* It attempts to send a post request to the FastAPI instance.
* If FastAPI is offline or times out, the service catches the error, logs it, and **falls back to a mock response** (satisfying the mock fallback requirement).
* If the FastAPI is online but returns bad JSON, the system throws a `FastAPIInvalidResponseError`, which is handled by the error middleware to return a `502 Bad Gateway` status.
* Support for a `forceLive=true` parameter is included. When active, it bypasses the mock fallback, throwing a `FastAPIUnavailableError` (503 status) on failure, allowing strict integration testing.

---

## 🛡️ Error Handling Strategy

All errors in the application are caught by the centralized Express error middleware (`src/middleware/error.ts`). 

### Error Hierarchy (`src/utils/errors.ts`)
* `AppError`: Base application error with custom status codes and system-wide codes.
* `NotFoundError` (404): Thrown when trying to retrieve or modify quotes that do not exist.
* `ValidationError` (400): Raised by the Zod middleware when request bodies or queries fail validation rules.
* `FastAPIUnavailableError` (503): Raised when the FastAPI service is offline and `forceLive` is requested.
* `FastAPIInvalidResponseError` (502): Thrown when the FastAPI returns malformed data structures.
* `DatabaseError` (500): Caught whenever Drizzle or SQLite encounters constraint violations or execution errors.

### Standardized Error JSON Output
All errors are returned in the following layout:
```json
{
  "success": false,
  "message": "Human readable error explanation",
  "error": "TECHNICAL_ERROR_CODE"
}
```

---

## 📮 Postman Collection
A complete Postman collection is saved at [Postman_Collection.json](./Postman_Collection.json) at the root of the project.
Import it directly into Postman, modify the variables, and start hitting endpoints!
