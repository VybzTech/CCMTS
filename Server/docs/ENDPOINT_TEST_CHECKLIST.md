# Endpoint Test Checklist

This checklist is designed to help you test each endpoint in the system.

## Authentication (Auth)

- [ ] **POST /signup**
  - **Description:** Register a new user.
  - **Role:** None
  - **Body:**
    - `username` (string, required)
    - `firstname` (string, required)
    - `lastname` (string, required)
    - `email` (string, required, unique)
    - `password` (string, required, min 6 chars)
    - `unit` (string, required)
    - `staffId` (string, required, unique)
    - `role` (string, optional, defaults to 'ORIGINATING', can be 'ADMIN' or 'MANAGEMENT')
  - **Tests:**
    - [ ] Successful signup with valid data.
    - [ ] Fail signup with existing username.
    - [ ] Fail signup with existing email.
    - [ ] Fail signup with existing staffId.
    - [ ] Fail signup with missing required fields.
    - [ ] Fail signup with invalid email.
    - [ ] Fail signup with short password.

- [ ] **POST /login**
  - **Description:** Log in a user.
  - **Role:** None
  - **Body:**
    - `username` (string, required)
    - `password` (string, required)
  - **Tests:**
    - [ ] Successful login with valid credentials.
    - [ ] Fail login with invalid username.
    - [ ] Fail login with invalid password.
    - [ ] Fail login with missing required fields.

## Courier

- [ ] **POST /**
  - **Description:** Create a new courier.
  - **Role:** ADMIN
  - **Body:**
    - `name` (string, required)
  - **Tests:**
    - [ ] Successful creation with valid data.
    - [ ] Fail creation with missing `name`.
    - [ ] Fail creation if not an ADMIN.

- [ ] **POST /assign**
  - **Description:** Assign a courier to one or more letters.
  - **Role:** ADMIN
  - **Body:**
    - `courierId` (string, required)
    - `letters` (array of strings, required)
  - **Tests:**
    - [ ] Successful assignment with valid data.
    - [ ] Fail assignment with invalid `courierId`.
    - [ ] Fail assignment with invalid `letters`.
    - [ ] Fail assignment if not an ADMIN.

- [ ] **POST /acknowledge-pod**
  - **Description:** Acknowledge Proof of Delivery (POD).
  - **Role:** ADMIN
  - **Body:**
    - `letterId` (string, required)
    - `signatory` (string, required)
  - **Tests:**
    - [ ] Successful acknowledgement with valid data.
    - [ ] Fail acknowledgement with invalid `letterId`.
    - [ ] Fail acknowledgement if not an ADMIN.

## Schedule

- [ ] **POST /create**
  - **Description:** Create a new schedule.
  - **Role:** ORIGINATING
  - **Body:**
    - `title` (string, required)
    - `liabilityYear` (string, required)
    - `companyName` (string, required)
    - `lga` (string, required)
    - `destination` (string, required)
    - `liabilityAmount` (float, required)
    - `urgency` (enum, required: 'MINIMAL', 'MEDIUM', 'HIGH', 'URGENT')
  - **Tests:**
    - [ ] Successful creation with valid data.
    - [ ] Fail creation with missing required fields.
    - [ ] Fail creation with invalid `urgency` value.
    - [ ] Fail creation if not an ORIGINATING user.

- [ ] **POST /submit**
  - **Description:** Submit letters for a schedule.
  - **Role:** ORIGINATING
  - **Body:**
    - `letterIds` (array of strings, required)
  - **Tests:**
    - [ ] Successful submission with valid data.
    - [ ] Fail submission with empty `letterIds`.
    - [ ] Fail submission if not an ORIGINATING user.

- [ ] **GET /**
  - **Description:** List all schedules.
  - **Role:** ORIGINATING, ADMIN, or MANAGEMENT
  - **Tests:**
    - [ ] Successful retrieval as ORIGINATING user.
    - [ ] Successful retrieval as ADMIN user.
    - [ ] Successful retrieval as MANAGEMENT user.
    - [ ] Fail retrieval if not authenticated.

- [ ] **GET /:id**
  - **Description:** Get a single schedule by ID.
  - **Role:** ORIGINATING, ADMIN, or MANAGEMENT
  - **Params:**
    - `id` (string, required)
  - **Tests:**
    - [ ] Successful retrieval with valid ID.
    - [ ] Fail retrieval with invalid ID.
    - [ ] Fail retrieval if not authenticated.

- [ ] **PATCH /:id/verify**
  - **Description:** Verify a schedule.
  - **Role:** ADMIN
  - **Params:**
    - `id` (string, required)
  - **Tests:**
    - [ ] Successful verification with valid ID.
    - [ ] Fail verification with invalid ID.
    - [ ] Fail verification if not an ADMIN.

- [ ] **PATCH /:id/reject**
  - **Description:** Reject a schedule.
  - **Role:** ADMIN
  - **Params:**
    - `id` (string, required)
  - **Tests:**
    - [ ] Successful rejection with valid ID.
    - [ ] Fail rejection with invalid ID.
    - [ ] Fail rejection if not an ADMIN.

- [ ] **PATCH /:id**
  - **Description:** Update a schedule.
  - **Role:** ADMIN
  - **Params:**
    - `id` (string, required)
  - **Body:** (any of the fields from create)
    - `title` (string)
    - `liabilityYear` (string)
    - `companyName` (string)
    - `lga` (string)
    - `destination` (string)
    - `liabilityAmount` (float)
    - `urgency` (enum)
  - **Tests:**
    - [ ] Successful update with valid ID and data.
    - [ ] Fail update with invalid ID.
    - [ ] Fail update if not an ADMIN.
