# Document & Logistics Tracking System (DLTS)

DLTS is a comprehensive web application designed to manage the full lifecycle of document and letter submissions within an organization. It streamlines the process from submission by an originating unit, through verification and sorting by an administrative unit, to delivery by a courier and final proof of delivery (POD) acknowledgement.

## Key Features

-   **Role-Based Access Control:** Different views and permissions for Originating Units, Administrative Units, and Management.
-   **Schedule (Letter Batch) Management:** Create, submit, and track batches of letters.
-   **Workflow Automation:** A well-defined status transition system guides each schedule from `DRAFT` to `COMPLETED`.
-   **Verification & Sorting:** Admins can verify the correctness of submissions, reject them with notes, and manage sorting information.
-   **Courier Assignment & Tracking:** Assign schedules to couriers and track the delivery status.
-   **Proof of Delivery (POD):** Acknowledge receipt of PODs to complete the delivery lifecycle.
-   **Dashboard & Reporting:** At-a-glance views for different user roles to monitor the status of schedules.

## Tech Stack

### Backend

-   **Framework:** Express.js
-   **Database:** PostgreSQL
-   **ORM:** Prisma
-   **Authentication:** JSON Web Tokens (JWT)
-   **Validation:** `express-validator`

### Frontend (as per design)

-   **Framework:** React (with Vite)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **State Management:** Zustand
-   **API Communication:** Axios

## API Endpoints

### Authentication (`/api/v1/auth`)

-   `POST /signup`: Register a new user.
-   `POST /login`: Log in a user and receive a JWT.

### Schedules (`/api/v1/schedules`)

-   `POST /create`: Create a new schedule (as a draft).
-   `POST /submit`: Submit one or more draft schedules for verification.
-   `GET /`: List schedules based on user role.
-   `GET /:id`: Get details of a specific schedule.
-   `PATCH /:id/verify`: (Admin) Verify a submitted schedule.
-   `PATCH /:id/reject`: (Admin) Reject a submitted schedule with notes.
-   `PATCH /:id`: (Admin) Update schedule details (e.g., status, sorting info).

### Courier (`/api/v1/courier`)

-   `POST /assign`: (Admin) Assign a courier to one or more schedules.
-   `POST /acknowledge-pod`: (Admin) Acknowledge a proof of delivery for a schedule.
-   `POST /`: (Admin) Create a new courier.

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm
-   Docker and Docker Compose

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/TheProject24/DLTS.git
    cd DLTS
    ```

2.  **Create an environment file:**
    Copy the example environment file and update the variables as needed.
    ```bash
    cp .env.example .env
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

1.  **Start the database:**
    The project uses Docker Compose to run a PostgreSQL database.
    ```bash
    docker-compose up -d
    ```

2.  **Run database migrations:**
    Apply the Prisma schema to the database.
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The API will be available at `http://localhost:3000`.

## Environment Variables

The following environment variables are required. See `.env.example` for a template.

-   `POSTGRES_USER`: PostgreSQL database username.
-   `POSTGRES_PASSWORD`: PostgreSQL database password.
-   `POSTGRES_DB`: PostgreSQL database name.
-   `DATABASE_URL`: The full connection string for Prisma.
-   `NODE_ENV`: The application environment (e.g., `development`, `production`).
-   `PORT`: The port for the Express server to run on.
-   `JWT_SECRET`: A secret key for signing JSON Web Tokens.
-   `JWT_EXPIRES_IN`: The expiration time for JWTs (e.g., `7d`).

## User Roles

-   **Originating Unit (`ORIGINATING`):** Can create and submit schedules and view the status of their own submissions.
-   **Administrative Unit (`ADMIN`):** Can manage the entire workflow after a schedule is submitted, including verification, rejection, courier assignment, and completion.
-   **Management (`MANAGEMENT`):** Has read-only access to all schedules and dashboards for oversight purposes.

## Project Structure

```
src/
├── app.js                 # Express application setup
├── config/                # Configuration files (database, constants)
├── controllers/           # Express controllers to handle API requests
├── middleware/            # Custom middleware (auth, validation)
├── models/                # (Prisma schema is used for models)
├── routes/                # API route definitions
├── services/              # Core business logic
├── types/                 # Type definitions
├── utils/                 # Utility functions
└── validators/            # Input validation rules
```