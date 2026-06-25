# 📖 API Testing Guide

This document serves as the comprehensive testing guide for the **Quote Analysis Service** API. It provides a detailed breakdown of all available endpoints, validation rules, error handling behavior, and instructions for testing using the included Postman Collection.

---

## 🌐 Base URL

All requests must be made against the following root path:

```text
http://localhost:5000/api
```

---

## ⚡ Core API Endpoints

### 1. Create Quote
Creates a new project quote in the database. Defaults the status to `New`.

* **Endpoint**: `POST /quotes`
* **Headers**: `Content-Type: application/json`
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
* **Path Parameter**: `id` (string, UUID format)

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

*(Note: If no analysis has been run yet for this quote, the `"analysis"` field will be `null`).*

---

### 4. Analyze Quote
Triggers document analysis on a quote request. Communicates with the external FastAPI microservice and saves the result in the local database.

* **Endpoint**: `POST /quotes/{id}/analyze`
* **Path Parameter**: `id` (string, UUID format)

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
* **Path Parameter**: `id` (string, UUID format)
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

## 🛡️ Validation Test Cases
Input payload structural validations are handled by Zod schemas and validated prior to routing control.

### 1. Missing Customer
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

### 2. Missing Project
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

### 3. Negative Estimated Value
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

### 4. Invalid Status
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

## 🚨 Error Handling Tests

### 1. Quote Not Found
Returned when requesting or altering a resource that does not exist in SQLite.

* **Endpoint**: `GET /quotes/invalid-uuid-format`
* **Expected Response (404 Not Found)**:
```json
{
  "success": false,
  "message": "Quote with ID invalid-uuid-format not found",
  "error": "NOT_FOUND"
}
```

### 2. FastAPI Service Unavailable
Returned if the FastAPI document analyzer endpoint is offline, and a live request is forced.

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

The associated [Postman_Collection.json](../Postman_Collection.json) at the root contains the requests pre-built in this hierarchy:

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
1. Open Postman, click **Import** and select the [Postman_Collection.json](../Postman_Collection.json) file.
2. Fire up the backend dev server (`npm run dev` or `docker-compose up`).
3. Import the collection and run requests in sequence. Ensure you copy the `"id"` string returned from the **Create Quote Request** response, and replace it in subsequent parameterized URLs.

---

## 📋 Submission Checklist

* [x] All APIs successfully tested inside Postman.
* [x] Screenshots placeholders added and detailed in documentation.
* [x] Postman Collection exported to [Postman_Collection.json](../Postman_Collection.json).
* [x] [README.md](../README.md) updated with full project installation steps.
* [x] [API_TESTING.md](./API_TESTING.md) completed with all success/error payloads.
* [x] Repository initialized and pushed to remote GitHub origin.
* [x] Backend builds cleanly (`npm run build`) without compiler alerts.
* [x] Zod validation edge cases completely covered and passing unit tests.
