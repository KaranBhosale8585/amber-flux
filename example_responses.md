# Example API Responses

This document details the expected request payloads and JSON response structures for each endpoint in the Quote Analysis Service.

---

## 1. Create a Quote Request
* **Endpoint**: `POST /api/quotes`
* **Content-Type**: `application/json`

### Success Case (201 Created)
* **Request Body**:
```json
{
  "customer": "Globex Corporation",
  "project": "Eco-Friendly Headquarter Office",
  "estimatedValue": 4500000.0
}
```
* **Response**:
```json
{
  "id": "7f87966f-24d1-4475-acb2-2db1ce2320b9",
  "customer": "Globex Corporation",
  "project": "Eco-Friendly Headquarter Office",
  "status": "New",
  "estimatedValue": 4500000.0,
  "createdDate": "2026-06-25T17:08:44.000Z"
}
```

### Validation Error (400 Bad Request) - Negative Estimated Value
* **Request Body**:
```json
{
  "customer": "Globex Corporation",
  "project": "Eco-Friendly Headquarter Office",
  "estimatedValue": -500
}
```
* **Response**:
```json
{
  "success": false,
  "message": "Estimated value must be greater than or equal to 0",
  "error": "VALIDATION_ERROR"
}
```

### Validation Error (400 Bad Request) - Missing Customer Name
* **Request Body**:
```json
{
  "project": "Eco-Friendly Headquarter Office",
  "estimatedValue": 100000
}
```
* **Response**:
```json
{
  "success": false,
  "message": "Customer name is required",
  "error": "VALIDATION_ERROR"
}
```

---

## 2. Retrieve All Quotes (With Pagination & Search)
* **Endpoint**: `GET /api/quotes`

### Success Case (200 OK) - No filters (returns seeded quotes)
* **Response**:
```json
[
  {
    "id": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "customer": "Globex Corporation",
    "project": "Eco-Friendly Headquarter Office",
    "status": "New",
    "estimatedValue": 4500000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  },
  {
    "id": "e936551b-5e6a-4d7a-b5e0-d0fb0c3a2f90",
    "customer": "Wayne Enterprises",
    "project": "Subterranean Lab Renovation",
    "status": "In Review",
    "estimatedValue": 9800000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  }
]
```

### Success Case (200 OK) - Search by Customer name `?customer=Wayne`
* **Response**:
```json
[
  {
    "id": "e936551b-5e6a-4d7a-b5e0-d0fb0c3a2f90",
    "customer": "Wayne Enterprises",
    "project": "Subterranean Lab Renovation",
    "status": "In Review",
    "estimatedValue": 9800000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  }
]
```

---

## 3. Retrieve Quote Details with Analysis
* **Endpoint**: `GET /api/quotes/:id`

### Success Case (200 OK) - With Analysis Performed
* **Response**:
```json
{
  "quote": {
    "id": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "customer": "Globex Corporation",
    "project": "Eco-Friendly Headquarter Office",
    "status": "New",
    "estimatedValue": 4500000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  },
  "analysis": {
    "id": "b3e945c7-df6d-4950-8438-fb1c7ff1ef2e",
    "quoteId": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "risk": "Medium",
    "confidence": 91,
    "missingItems": [
      "Structural drawings",
      "Load requirements"
    ],
    "analyzedAt": "2026-06-25T17:10:12.000Z"
  }
}
```

### Success Case (200 OK) - Without Analysis Performed yet
* **Response**:
```json
{
  "quote": {
    "id": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "customer": "Globex Corporation",
    "project": "Eco-Friendly Headquarter Office",
    "status": "New",
    "estimatedValue": 4500000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  },
  "analysis": null
}
```

### Error Case (404 Not Found) - Invalid ID
* **Response**:
```json
{
  "success": false,
  "message": "Quote with ID 5ea50259-25f0-4fa8-b2a6-411a2f6ad999 not found",
  "error": "NOT_FOUND"
}
```

---

## 4. Update Quote Status
* **Endpoint**: `PATCH /api/quotes/:id/status`
* **Content-Type**: `application/json`

### Success Case (200 OK)
* **Request Body**:
```json
{
  "status": "In Review"
}
```
* **Response**:
```json
{
  "id": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
  "customer": "Globex Corporation",
  "project": "Eco-Friendly Headquarter Office",
  "status": "In Review",
  "estimatedValue": 4500000,
  "createdDate": "2026-06-25T17:06:55.000Z"
}
```

### Error Case (400 Bad Request) - Invalid Status Value
* **Request Body**:
```json
{
  "status": "Approved"
}
```
* **Response**:
```json
{
  "success": false,
  "message": "Invalid status. Allowed values: New, In Review, Needs Info, Completed",
  "error": "VALIDATION_ERROR"
}
```

---

## 5. Analyze Quote (FastAPI Integration)
* **Endpoint**: `POST /api/quotes/:id/analyze`

### Success Case (200 OK) - Live / Mock Fallback
* **Response**:
```json
{
  "quote": {
    "id": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "customer": "Globex Corporation",
    "project": "Eco-Friendly Headquarter Office",
    "status": "New",
    "estimatedValue": 4500000,
    "createdDate": "2026-06-25T17:06:55.000Z"
  },
  "analysis": {
    "id": "b3e945c7-df6d-4950-8438-fb1c7ff1ef2e",
    "quoteId": "5ea50259-25f0-4fa8-b2a6-411a2f6adabf",
    "risk": "Medium",
    "confidence": 91,
    "missingItems": [
      "Structural drawings",
      "Load requirements"
    ],
    "analyzedAt": "2026-06-25T17:10:12.000Z"
  }
}
```

### Error Case (503 Service Unavailable) - FastAPI offline (when calling with `?forceLive=true`)
* **Endpoint**: `POST /api/quotes/5ea50259-25f0-4fa8-b2a6-411a2f6adabf/analyze?forceLive=true`
* **Response**:
```json
{
  "success": false,
  "message": "FastAPI service connection failed: connect ECONNREFUSED 127.0.0.1:8000",
  "error": "FASTAPI_UNAVAILABLE"
}
```

### Error Case (502 Bad Gateway) - FastAPI active but returns corrupted structure
* **Response**:
```json
{
  "success": false,
  "message": "FastAPI document analysis service returned an invalid response",
  "error": "FASTAPI_INVALID_RESPONSE"
}
```
