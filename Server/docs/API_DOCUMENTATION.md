# DLTS API Documentation

## Overview

**Base URL:** `/api/v1`

**Authentication:** Most endpoints require authentication via JWT token. Include the token either as:
- Cookie: `jwt=<token>`
- Header: `Authorization: Bearer <token>`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Directorates](#directorates)
3. [Letters](#letters)
4. [Couriers](#couriers)

---

## Authentication

### POST `/auth/signup`

Create a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "ODU",
  "directorateId": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full name of the user |
| email | string | Yes | Unique email address |
| password | string | Yes | User password (min 8 characters recommended) |
| role | string | No | User role: `ODU`, `Admin`, or `Management`. Defaults to `ODU` |
| directorateId | number | No | ID of the directorate the user belongs to |

**Response (201 Created):**
```json
{
  "message": "User Created",
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ODU"
  }
}
```

**Response (500 Internal Server Error):**
```json
{
  "message": "Internal Server Error",
  "error": "Error description"
}
```

---

### POST `/auth/login`

Authenticate user and receive access token.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Response (200 OK):**
```json
{
  "id": "1",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "ODU",
  "directorate": {
    "id": "1",
    "name": "IT Services",
    "code": "IT",
    "description": "Information Technology Services"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid email or password"
}
```

---

### GET `/auth/me`

Get current authenticated user's information.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "user": {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ODU",
    "directorateId": "1"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Not Logged In"
}
```

---

## Directorates

### GET `/directorates`

Get all directorates.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "directorates": [
    {
      "id": "1",
      "name": "Human Resources",
      "code": "HR",
      "description": "Human Resources Department",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "2",
      "name": "Finance",
      "code": "FIN",
      "description": "Finance and Accounts Department",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/directorates/:directorate_id`

Get a specific directorate with its users and recent letters.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| directorate_id | number | The ID of the directorate |

**Request Body:** None

**Response (200 OK):**
```json
{
  "directorate": {
    "id": "1",
    "name": "IT Services",
    "code": "IT",
    "description": "Information Technology Services",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "users": [
      {
        "id": "6",
        "name": "IT Officer",
        "email": "it@lirs.gov.ng",
        "role": "ODU"
      }
    ],
    "letters": [
      {
        "id": "55",
        "trackingId": "LTR-2026-054",
        "subject": "Tax Assessment Notice",
        "status": "Approved",
        "createdAt": "2026-01-19T11:17:42.000Z"
      }
    ]
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Directorate not found"
}
```

---

### POST `/directorates`

Create a new directorate.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Marketing",
  "code": "MKT",
  "description": "Marketing and Communications Department"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Name of the directorate |
| code | string | Yes | Unique code for the directorate |
| description | string | No | Description of the directorate |

**Response (201 Created):**
```json
{
  "message": "Directorate Created",
  "directorate": {
    "id": "15",
    "name": "Marketing",
    "code": "MKT"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Directorate code already exists"
}
```

---

### PATCH `/directorates/:directorate_id`

Update a directorate.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| directorate_id | number | The ID of the directorate |

**Request Body:**
```json
{
  "name": "Marketing & Communications",
  "description": "Updated description"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New name for the directorate |
| description | string | No | New description |

**Response (200 OK):**
```json
{
  "message": "Directorate updated",
  "directorate": {
    "id": "15",
    "name": "Marketing & Communications",
    "code": "MKT",
    "description": "Updated description"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Directorate not found"
}
```

---

### DELETE `/directorates/:directorate_id`

Delete a directorate.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| directorate_id | number | The ID of the directorate |

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Directorate deleted"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Cannot delete directorate with associated users or letters"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Directorate not found"
}
```

---

## Letters

### GET `/letters`

Get all letters with pagination and optional filters.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| status | string | No | Filter by status: `Pending_Approval`, `Approved`, `Assigned`, `In_Transit`, `Delivered`, `Undelivered` |
| priority | string | No | Filter by priority: `Low`, `Medium`, `High` |
| directorate_id | number | No | Filter by sender directorate |

**Request Body:** None

**Response (200 OK):**
```json
{
  "letters": [
    {
      "id": "1",
      "trackingId": "LTR-2026-001",
      "senderDirectorateId": "6",
      "createdById": "3",
      "recipientName": "Recipient 1",
      "recipientAddress": "Building 8, Floor 2, Office 338",
      "subject": "Official Document 1 - Contract",
      "priority": "Medium",
      "status": "Approved",
      "liabilityValue": "8229.00",
      "courierId": null,
      "assignedAt": null,
      "approvedById": "1",
      "approvedAt": "2026-01-15T12:49:47.000Z",
      "deliveredAt": null,
      "attachmentPath": null,
      "notes": null,
      "createdAt": "2026-01-14T12:44:35.000Z",
      "updatedAt": null,
      "senderDirectorate": {
        "id": "6",
        "name": "Marketing",
        "code": "MKT"
      },
      "courier": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### GET `/letters/:letter_id`

Get a specific letter with full details including timeline.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter |

**Request Body:** None

**Response (200 OK):**
```json
{
  "letter": {
    "id": "1",
    "trackingId": "LTR-2026-001",
    "senderDirectorateId": "6",
    "createdById": "3",
    "recipientName": "Recipient 1",
    "recipientAddress": "Building 8, Floor 2, Office 338",
    "subject": "Official Document 1 - Contract",
    "priority": "Medium",
    "status": "Approved",
    "liabilityValue": "8229.00",
    "courierId": null,
    "assignedAt": null,
    "approvedById": "1",
    "approvedAt": "2026-01-15T12:49:47.000Z",
    "deliveredAt": null,
    "attachmentPath": null,
    "notes": null,
    "createdAt": "2026-01-14T12:44:35.000Z",
    "updatedAt": null,
    "senderDirectorate": {
      "id": "6",
      "name": "Marketing",
      "code": "MKT",
      "description": "Marketing and Communications"
    },
    "createdBy": {
      "id": "3",
      "name": "HR Officer",
      "email": "hr@ccmts.com"
    },
    "approvedBy": {
      "id": "1",
      "name": "Admin User"
    },
    "courier": null,
    "timelines": [
      {
        "id": "51",
        "letterId": "1",
        "status": "Approved",
        "description": "Letter approved by Admin User",
        "userId": "1",
        "createdAt": "2026-01-15T12:49:47.000Z",
        "user": {
          "name": "Admin User"
        }
      },
      {
        "id": "1",
        "letterId": "1",
        "status": "Registered",
        "description": "Letter registered in the system",
        "userId": "3",
        "createdAt": "2026-01-14T12:44:35.000Z",
        "user": {
          "name": "HR Officer"
        }
      }
    ]
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found"
}
```

---

### POST `/letters/single`

Create a single letter.

**Authentication:** Required

**Request Body:**
```json
{
  "sender_directorate_id": 3,
  "recipient_name": "Adebayo Ogundimu",
  "recipient_address": "15 Awolowo Road, Ikeja, Lagos State",
  "subject": "Tax Assessment Notice",
  "priority": "High",
  "liability_value": 45000.00,
  "notes": "Urgent delivery required"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sender_directorate_id | number | Yes | ID of the sending directorate |
| recipient_name | string | Yes | Name of the recipient |
| recipient_address | string | Yes | Full address of the recipient |
| subject | string | Yes | Subject/title of the letter |
| priority | string | No | Priority level: `Low`, `Medium`, `High`. Defaults to `Medium` |
| liability_value | number | No | Monetary value associated with the letter. Defaults to 0 |
| notes | string | No | Additional notes |

**Response (201 Created):**
```json
{
  "message": "Letter Created",
  "letter": {
    "id": "233",
    "trackingId": "LTR-2026-233",
    "subject": "Tax Assessment Notice",
    "priority": "High",
    "status": "Pending_Approval"
  }
}
```

---

### POST `/letters/bulk`

Create multiple letters at once.

**Authentication:** Required

**Request Body:**
```json
[
  {
    "sender_directorate_id": 3,
    "recipient_name": "Adebayo Ogundimu",
    "recipient_address": "15 Awolowo Road, Ikeja, Lagos State",
    "subject": "Tax Assessment Notice",
    "priority": "Medium",
    "liability_value": 45000.00,
    "notes": "Standard delivery"
  },
  {
    "sender_directorate_id": 3,
    "recipient_name": "Chidinma Okafor",
    "recipient_address": "23 Marina Street, Lagos Island",
    "subject": "Audit Report 2025",
    "priority": "High",
    "liability_value": 250000.00,
    "notes": "Confidential document"
  }
]
```

**Response (201 Created):**
```json
{
  "message": "Letters Created successfully",
  "count": 2
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid input: Expected a non-empty array of letters."
}
```

---

### PATCH `/letters/:letter_id/approve`

Approve a letter (typically done by Admin/Management).

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter to approve |

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Letter Approved",
  "letter": {
    "id": "233",
    "trackingId": "LTR-2026-233",
    "status": "Approved"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found"
}
```

---

### PATCH `/letters/:letter_id/reject`

Reject a letter.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter to reject |

**Request Body:**
```json
{
  "reason": "Incomplete recipient information"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Reason for rejection |

**Response (200 OK):**
```json
{
  "message": "Letter Rejected"
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found"
}
```

---

### POST `/letters/auto-allocate`

Trigger automatic allocation of approved letters to couriers.

**Authentication:** Required

**Request Body:**
```json
{
  "letterIds": ["55", "56", "57"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| letterIds | string[] | Yes | Array of letter IDs to allocate |

**Response (202 Accepted):**
```json
{
  "message": "Allocation engine started in the background",
  "processing": 3,
  "skipped": 0
}
```

**Response (400 Bad Request):**
```json
{
  "message": "No approved letters found among the provided IDs.",
  "skipped": 3
}
```

---

### POST `/letters/:letter_id/allocate/:courier_id`

Manually allocate a letter to a specific courier.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter |
| courier_id | number | The ID of the courier |

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Letter successfully allocated to courier.",
  "data": {
    "id": "55",
    "trackingId": "LTR-2026-054",
    "status": "Assigned",
    "courierId": "1",
    "assignedAt": "2026-01-21T15:30:00.000Z",
    "senderDirectorateId": "3",
    "createdById": "6",
    "approvedById": "1",
    "courier": {
      "name": "John Courier",
      "phone": "08012345678"
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found. Check the letter ID."
}
```

---

### PATCH `/letters/:letter_id/in-transit`

Mark a letter as in transit.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter |

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Letter marked as in transit",
  "letter": {
    "id": "55",
    "trackingId": "LTR-2026-054",
    "status": "In_Transit"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found"
}
```

---

### PATCH `/letters/:letter_id/delivered`

Mark a letter as delivered.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter |

**Request Body:** None

**Response (200 OK):**
```json
{
  "message": "Letter marked as delivered",
  "letter": {
    "id": "55",
    "trackingId": "LTR-2026-054",
    "status": "Delivered",
    "deliveredAt": "2026-01-21T16:45:00.000Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found"
}
```

---

### PATCH `/letters/:letter_id/undelivered`

Mark a letter as undelivered (delivery failed).

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| letter_id | number | The ID of the letter |

**Request Body:**
```json
{
  "reason": "Recipient not available at address"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Reason for failed delivery |

**Response (200 OK):**
```json
{
  "message": "Letter marked as undelivered",
  "letter": {
    "id": "55",
    "trackingId": "LTR-2026-054",
    "status": "Undelivered"
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Letter not found"
}
```

---

## Couriers

### GET `/couriers`

Get all available couriers.

**Authentication:** Required

**Request Body:** None

**Response (200 OK):**
```json
{
  "couriers": [
    {
      "id": "1",
      "name": "John Courier",
      "phone": "08012345678",
      "email": "john@courier.com",
      "availability": true,
      "activeTasks": 2,
      "performance": 95,
      "completedDeliveries": 45,
      "createdAt": null,
      "updatedAt": null
    },
    {
      "id": "2",
      "name": "Jane Courier",
      "phone": "08012345679",
      "email": "jane@courier.com",
      "availability": true,
      "activeTasks": 1,
      "performance": 88,
      "completedDeliveries": 38,
      "createdAt": null,
      "updatedAt": null
    }
  ]
}
```

---

### GET `/couriers/:courier_id`

Get a specific courier with their active letters.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| courier_id | number | The ID of the courier |

**Request Body:** None

**Response (200 OK):**
```json
{
  "courier": {
    "id": "1",
    "name": "John Courier",
    "phone": "08012345678",
    "email": "john@courier.com",
    "availability": true,
    "activeTasks": 2,
    "performance": 95,
    "completedDeliveries": 45,
    "createdAt": null,
    "updatedAt": null,
    "letters": [
      {
        "id": "8",
        "trackingId": "LTR-2026-008",
        "recipientName": "Recipient 8",
        "recipientAddress": "Building 9, Floor 1, Office 129",
        "subject": "Official Document 8 - Memo",
        "priority": "Low",
        "status": "Assigned",
        "senderDirectorateId": "3",
        "createdById": "3",
        "courierId": "1",
        "approvedById": null
      }
    ]
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Courier not found"
}
```

---

### POST `/couriers`

Create a new courier.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Courier",
  "email": "newcourier@example.com",
  "phone": "08098765432"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full name of the courier |
| email | string | No | Email address |
| phone | string | No | Phone number |

**Response (201 Created):**
```json
{
  "message": "Courier Created",
  "courier": {
    "id": "7",
    "name": "New Courier",
    "email": "newcourier@example.com",
    "phone": "08098765432"
  }
}
```

---

### PATCH `/couriers/:courier_id/availability`

Update a courier's availability status.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| courier_id | number | The ID of the courier |

**Request Body:**
```json
{
  "availability": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| availability | boolean | Yes | Whether the courier is available for assignments |

**Response (200 OK):**
```json
{
  "message": "Courier availability updated",
  "courier": {
    "id": "1",
    "name": "John Courier",
    "availability": false
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Courier not found"
}
```

---

### PATCH `/couriers/:courier_id/performance`

Update courier performance stats after a delivery attempt.

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| courier_id | number | The ID of the courier |

**Request Body:**
```json
{
  "delivered": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| delivered | boolean | Yes | Whether the delivery was successful |

**Response (200 OK):**
```json
{
  "message": "Courier stats updated",
  "courier": {
    "id": "1",
    "name": "John Courier",
    "completedDeliveries": 46,
    "activeTasks": 1
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Courier not found"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token provided"
}
```
```json
{
  "message": "Not authorized, invalid token"
}
```
```json
{
  "message": "Not authorized, token expired"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Detailed error message"
}
```

---

## Data Types Reference

### User Roles
| Value | Description |
|-------|-------------|
| `ODU` | Origin Dispatch Unit - Standard user who creates letters |
| `Admin` | Administrator - Can approve/reject letters and manage system |
| `Management` | Management level - Oversight and reporting access |

### Letter Status
| Value | Description |
|-------|-------------|
| `Pending_Approval` | Letter created, awaiting approval |
| `Approved` | Letter approved, ready for assignment |
| `Assigned` | Letter assigned to a courier |
| `In_Transit` | Letter is being delivered |
| `Delivered` | Letter successfully delivered |
| `Undelivered` | Delivery failed |

### Priority Levels
| Value | Description |
|-------|-------------|
| `Low` | Standard processing |
| `Medium` | Normal priority (default) |
| `High` | Urgent processing required |

### Notification Types
| Value | Description |
|-------|-------------|
| `success` | Positive notification (e.g., letter approved) |
| `info` | Informational notification |
| `warning` | Warning notification (e.g., delivery failed) |
| `error` | Error notification (e.g., letter rejected) |
