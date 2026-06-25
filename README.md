# 🏛️ Backend Internship Assignment: Quote Analysis Service

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

## 🏛️ Design Decisions & Architecture

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

## 🧪 API Testing Guide

### Base URL
```text
http://localhost:5000/api
```

---

### 1. Create Quote
Creates a new project quote in the database. Defaults the status to `New`.

* **Endpoint**: `POST /quotes`
* **Request Body**:
```json
{
  "customer": "ABC Constructions",
  "project": "Commercial Tower",
  "estimatedValue": 500000
}
```
* **Expected Success Response (201 Created)**:
```json
{
  "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
  "customer": "ABC Constructions",
  "project": "Commercial Tower",
  "status": "New",
  "estimatedValue": 500000,
  "createdDate": "2026-06-25T17:15:30.000Z"
}
```

---

### 2. Get All Quotes
Retrieves all stored quote requests. If no filters are provided, returns all records with default pagination.

* **Endpoint**: `GET /quotes`
* **Expected Success Response (200 OK)**:
```json
[
  {
    "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "customer": "ABC Constructions",
    "project": "Commercial Tower",
    "status": "New",
    "estimatedValue": 500000,
    "createdDate": "2026-06-25T17:15:30.000Z"
  },
  {
    "id": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "customer": "Globex Corporation",
    "project": "Eco-Friendly Headquarter Office",
    "status": "New",
    "estimatedValue": 4500000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  }
]
```

---

### 3. Get Quote By ID
Fetches details of a specific quote request along with its document analysis results (if performed).

* **Endpoint**: `GET /quotes/{id}`
* **Expected Success Response (200 OK)**:
```json
{
  "quote": {
    "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "customer": "ABC Constructions",
    "project": "Commercial Tower",
    "status": "In Review",
    "estimatedValue": 500000,
    "createdDate": "2026-06-25T17:15:30.000Z"
  },
  "analysis": {
    "id": "b3e945c7-df6d-4950-8438-fb1c7ff1ef2e",
    "quoteId": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "risk": "Medium",
    "confidence": 91,
    "missingItems": [
      "Structural drawings",
      "Load requirements"
    ],
    "analyzedAt": "2026-06-25T17:20:10.000Z"
  }
}
```

---

### 4. Analyze Quote
Triggers document analysis on a quote request. Communicates with the external FastAPI microservice and saves the result in the local database.

* **Endpoint**: `POST /quotes/{id}/analyze`
* **Expected Success Response (200 OK)**:
```json
{
  "quote": {
    "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "customer": "ABC Constructions",
    "project": "Commercial Tower",
    "status": "New",
    "estimatedValue": 500000,
    "createdDate": "2026-06-25T17:15:30.000Z"
  },
  "analysis": {
    "id": "b3e945c7-df6d-4950-8438-fb1c7ff1ef2e",
    "quoteId": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "risk": "Medium",
    "confidence": 91,
    "missingItems": [
      "Structural drawings",
      "Load requirements"
    ],
    "analyzedAt": "2026-06-25T17:20:10.000Z"
  }
}
```

---

### 5. Update Quote Status
Modifies the status of a quote request. The status value must be one of: `New`, `In Review`, `Needs Info`, `Completed`.

* **Endpoint**: `PATCH /quotes/{id}/status`
* **Request Body**:
```json
{
  "status": "In Review"
}
```
* **Expected Success Response (200 OK)**:
```json
{
  "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
  "customer": "ABC Constructions",
  "project": "Commercial Tower",
  "status": "In Review",
  "estimatedValue": 500000,
  "createdDate": "2026-06-25T17:15:30.000Z"
}
```

---

### 6. Search Quotes
Filters the stored quote requests by project name or customer name.

* **Endpoint**: `GET /quotes?customer=ABC` or `GET /quotes?project=Tower`
* **Expected Success Response (200 OK)**:
```json
[
  {
    "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "customer": "ABC Constructions",
    "project": "Commercial Tower",
    "status": "In Review",
    "estimatedValue": 500000,
    "createdDate": "2026-06-25T17:15:30.000Z"
  }
]
```

---

### 7. Pagination
Applies pagination offsets and limits to retrieve subset records.

* **Endpoint**: `GET /quotes?page=1&limit=5`
* **Expected Success Response (200 OK)**:
```json
[
  {
    "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
    "customer": "ABC Constructions",
    "project": "Commercial Tower",
    "status": "In Review",
    "estimatedValue": 500000,
    "createdDate": "2026-06-25T17:15:30.000Z"
  }
]
```

---

## 🛡️ Input Validation Test Cases

### Missing Customer
* **Endpoint**: `POST /quotes`
* **Request Body**:
```json
{
  "project": "Commercial Tower",
  "estimatedValue": 500000
}
```
* **Expected Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Customer name is required",
  "error": "VALIDATION_ERROR"
}
```

### Missing Project
* **Endpoint**: `POST /quotes`
* **Request Body**:
```json
{
  "customer": "ABC Constructions",
  "estimatedValue": 500000
}
```
* **Expected Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Project name is required",
  "error": "VALIDATION_ERROR"
}
```

### Negative Estimated Value
* **Endpoint**: `POST /quotes`
* **Request Body**:
```json
{
  "customer": "ABC",
  "project": "Tower",
  "estimatedValue": -100
}
```
* **Expected Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Estimated value must be greater than or equal to 0",
  "error": "VALIDATION_ERROR"
}
```

### Invalid Status
* **Endpoint**: `PATCH /quotes/{id}/status`
* **Request Body**:
```json
{
  "status": "Approved"
}
```
* **Expected Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Invalid status. Allowed values: New, In Review, Needs Info, Completed",
  "error": "VALIDATION_ERROR"
}
```

---

## 🚨 Error Handling Edge Cases

### Quote Not Found
* **Endpoint**: `GET /quotes/invalid-uuid-format`
* **Expected Response (404 Not Found)**:
```json
{
  "success": false,
  "message": "Quote with ID invalid-uuid-format not found",
  "error": "NOT_FOUND"
}
```

### FastAPI Service Unavailable
* **Endpoint**: `POST /quotes/{id}/analyze?forceLive=true`
* **Expected Response (503 Service Unavailable)**:
```json
{
  "success": false,
  "message": "FastAPI service connection failed: connect ECONNREFUSED 127.0.0.1:8000",
  "error": "FASTAPI_UNAVAILABLE"
}
```

---

## 📮 Postman Collection Structure

The associated [Postman_Collection.json](./Postman_Collection.json) at the root contains the requests pre-built in this hierarchy:

```text
Quote APIs/
├── Quotes/
│   ├── Create Quote Request
│   ├── Get All Quotes (With Search and Pagination)
│   ├── Get Quote Details with Analysis by ID
│   ├── Update Quote Status
│   └── Analyze Quote (FastAPI Integration)
└── System/
    ├── API Documentation (Swagger)
    └── System Health Check
```

To use it:
1. Open Postman, click **Import** and select the [Postman_Collection.json](./Postman_Collection.json) file.
2. Fire up the backend dev server (`npm run dev` or `docker-compose up`).
3. Import the collection and run requests in sequence. Ensure you copy the `"id"` string returned from the **Create Quote Request** response, and replace it in subsequent parameterized URLs.

---

## 📋 Submission Checklist

* [x] All APIs tested in Postman
* [x] Screenshots captured
* [x] Postman Collection exported
* [x] README updated
* [x] API_TESTING.md completed
* [x] GitHub repository pushed
* [x] Project builds successfully
* [x] All validation scenarios tested
