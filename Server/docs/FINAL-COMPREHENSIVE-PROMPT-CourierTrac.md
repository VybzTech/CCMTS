# Document & Logistics Tracking System - Production MVP Build Guide

## 🎯 OBJECTIVE

Build a production-ready React web application that integrates with the LIRS DLTS API to manage the complete letter/schedule submission → verification → courier delivery → POD → completion lifecycle.

---

## 🛠️ TECH STACK & DEPENDENCIES

- **Frontend:** Vite + React 18+ + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** React Icons
- **Animations:** Framer Motion (lightweight)
- **Routing:** React Router v6+
- **State:** Zustand (simple, minimal)
- **API:** Axios
- **Forms:** React Hook Form + Zod validation
- **Dev API:** JSON Server (mock backend)

## 👥 USER ROLES (3 Simple Roles)

### 1. Originating Unit User

**Purpose:** Submit letter batches (Schedules)

**Can Do:**

- Create new Schedule (form + file upload)
- View own Schedules and their status
- See confirmation when verified
- See when completed (ready for pickup)

**Cannot Do:**

- Edit after submission
- Access other units' data
- Perform admin actions

### 2. Administrative Unit User

**Purpose:** Verify, sort, track delivery, complete lifecycle

**Can Do:**

- Dashboard: view pending Schedules
- Verify Schedules (count check, field validation)
- Return invalid Schedules with notes
- Edit sorting assignments (text field)
- Mark as Sorted → ready for courier
- Log courier pickup
- Upload/log returned PODs
- Verify PODs vs Schedule → mark letters Delivered/Returned
- Mark Schedule as Completed

**Cannot Do:**

- Create Schedules
- Delete Schedules

### 3. Management User (View Only)

**Purpose:** Oversight and monitoring

**Can Do:**

- View all Schedules (read-only)
- Access overview dashboard with metrics
- View chat/support (future)

**Cannot Do:**

- Edit or action any Schedule

---

### Core Framework

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "typescript": "^5.3.0"
  }
}
```

### State Management & API

```json
{
  "zustand": "^4.4.7",
  "axios": "^1.6.2",
  "react-query": "^3.39.3"
}
```

### Forms & Validation

```json
{
  "react-hook-form": "^7.49.2",
  "zod": "^3.22.4",
  "@hookform/resolvers": "^3.3.3"
}
```

### UI & Styling

```json
{
  "tailwindcss": "^3.3.6",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "react-icons": "^4.12.0",
  "framer-motion": "^10.16.16",
  "react-hot-toast": "^2.4.1"
}
```

### Utilities

```json
{
  "date-fns": "^2.30.0",
  "clsx": "^2.0.0"
}
```

### Dev Dependencies

```json
{
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.0.8"
}
```

---

## 🌐 API INTEGRATION

### Base Configuration

```typescript
// src/config/api.config.ts
export const API_CONFIG = {
  baseUrl: "https://lirs-dlts/api/v1",
  version: "v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};
```

### API Endpoints Map

```typescript
// src/services/api/endpoints.ts
export const ENDPOINTS = {
  // Authentication
  SIGNUP: "/signup",
  LOGIN: "/login",

  // Schedules/Letters
  CREATE_SCHEDULE: "/schedules/create",
  SUBMIT_LETTERS: "/schedules/submit",
  LIST_SCHEDULES: "/schedules/",
  VIEW_SCHEDULE: (id: string) => `/schedules/${id}`,
  UPDATE_SCHEDULE: (id: string) => `/schedules/${id}/`,

  // Admin Actions
  VERIFY_SCHEDULE: (id: string) => `/schedules/${id}/verify`,
  REJECT_SCHEDULE: (id: string) => `/schedules/${id}/reject`,

  // Courier Management
  ASSIGN_COURIER: "/courier/assign",
  ACKNOWLEDGE_POD: "/courier/acknowledge-POD",
} as const;
```

---

## 📊 DATA MODELS (Aligned with API)

### User Model

```typescript
// src/types/user.types.ts
export interface User {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  unit: string; // Originating unit (e.g., "ASSESSMENT", "RMU", "IT")
  staffId: string;
  role: "originating" | "admin" | "management";
}

export interface SignupRequest {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  unit: string;
  staffId: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  username: string;
  email: string;
  unit: string;
}
```

### Schedule Model

```typescript
// src/types/schedule.types.ts
export type ScheduleStatus =
  | "draft"
  | "submitted"
  | "verified"
  | "rejected"
  | "sorted"
  | "pickedUp"
  | "podReceived"
  | "completed";

export type UrgencyLevel = "MINIMAL" | "MEDIUM" | "HIGH" | "URGENT";

export interface Schedule {
  scheduleId?: string; // Auto-generated (e.g., "SCH-1975")

  // Basic Info
  title: string; // e.g., "Incomplete TCC"
  liabilityYear: string; // "2026"
  companyName: string; // "Nestle PLC"
  lga: string; // "KOSOFE"
  destination: string; // Full address
  liabilityAmount: number; // 15000000

  // Status & Priority
  status: ScheduleStatus;
  urgency: UrgencyLevel;

  // Metadata
  letterCount?: number; // Total letters in schedule
  submittedAt?: string; // ISO datetime
  verifiedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;

  // Sorting & Courier
  sortingInfo?: {
    group: string; // "group1", "group2", etc.
  };
  assignedCourier?: {
    courierId: string;
    name?: string;
  };

  // POD
  podSignatory?: string; // "Mr Michael Simpson"
  podFile?: string; // URL to uploaded POD file

  // Admin notes
  verificationNotes?: string; // Rejection reason

  // Originating unit (from user context)
  originatingUnit?: string;
}

export interface CreateScheduleRequest {
  title: string;
  liabilityYear: string;
  companyName: string;
  lga: string;
  status: "submitted";
  urgency: UrgencyLevel;
  destination: string;
  liabilityAmount: number;
  submittedAt: string; // ISO datetime
  sortingInfo?: {
    group: string;
  };
}

export interface SubmitLettersRequest {
  letterIds: string[]; // Array of letter-id strings
}

export interface AssignCourierRequest {
  courierId: string;
  letters: string[]; // Array of letter-id strings
}

export interface AcknowledgePODRequest {
  letterId: string;
  signatory: string;
}
```

---

## 🔄 WORKFLOW & STATUS TRANSITIONS (API-Aligned)

### Linear Flow with API Calls

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

1. ORIGINATING UNIT CREATES LETTERS
   ├─ User fills form for each letter
   ├─ POST /schedules/create (status: "submitted")
   ├─ Headers: X-User-Unit: "{ORIGINATING_UNIT}"
   ├─ Can create multiple letters
   └─ Letters stored as "draft" initially

2. ORIGINATING UNIT SUBMITS BATCH
   ├─ Select multiple letters to submit together
   ├─ POST /schedules/submit with array of letter IDs
   ├─ Status: draft → submitted
   └─ Response: "Letters submitted successfully, awaiting verification"

3. ADMIN VIEWS PENDING SCHEDULES
   ├─ GET /schedules/ (filtered by status: "submitted")
   ├─ Headers: X-User-Unit: "ADMIN"
   └─ Dashboard shows pending verification queue

4. ADMIN VERIFIES SCHEDULE
   ├─ GET /schedules/{letter-id} to view details
   ├─ Checks: letter count, addresses, required fields
   ├─ Decision:
   │  ├─ APPROVE: PATCH /schedules/{letter-id}/verify
   │  │  ├─ Status: submitted → verified
   │  │  ├─ Response: "Successfully verified schedule, moved to sorting engine"
   │  │  └─ Time check:
   │  │     ├─ Before 10:00 AM → Same day pickup
   │  │     └─ After 10:00 AM → Next business day
   │  └─ REJECT: PATCH /schedules/{letter-id}/reject
   │     ├─ Status: submitted → rejected
   │     └─ Response: "Successfully disqualified schedule"

5. ADMIN ASSIGNS TO COURIER
   ├─ POST /courier/assign
   ├─ Body: { courierId: "010", letters: ["{letter-id}", ...] }
   ├─ Status: verified → sorted (implicitly)
   └─ Response: "letters assigned to courier"

6. COURIER PICKS UP (Admin logs)
   ├─ PATCH /schedules/{letter-id}/
   ├─ Update status: sorted → pickedUp
   └─ Record pickedUpAt timestamp

7. COURIER RETURNS WITH POD
   ├─ POST /courier/acknowledge-POD
   ├─ Body: { letterId: "{letter-id}", signatory: "Mr Michael Simpson" }
   ├─ Status: pickedUp → podReceived
   └─ Response: "POD acknowledged, Notifying Originating unit"

8. ADMIN VERIFIES POD & COMPLETES
   ├─ Review POD details
   ├─ PATCH /schedules/{letter-id}/
   ├─ Update status: podReceived → completed
   └─ Set completedAt timestamp

9. ORIGINATING UNIT VIEWS COMPLETION
   ├─ GET /schedules/ (filter: status = "completed")
   └─ In-app notification: "Schedule ready for pickup"
```

---

## 🏗️ PROJECT STRUCTURE

```
src/
├── config/
│   ├── api.config.ts          # Base API configuration
│   └── constants.ts           # App constants (LGA list, urgency levels)
│
├── services/
│   ├── api/
│   │   ├── axios.config.ts    # Axios instance with interceptors
│   │   ├── endpoints.ts       # API endpoint definitions
│   │   ├── auth.service.ts    # Login, signup, logout
│   │   ├── schedule.service.ts # Schedule CRUD operations
│   │   └── courier.service.ts # Courier assignment & POD
│   └── storage/
│       └── local-storage.ts   # User session management
│
├── hooks/
│   ├── useAuth.ts             # Authentication hook
│   ├── useSchedules.ts        # Schedule data fetching
│   └── useScheduleMutations.ts # Create, update, delete schedules
│
├── store/
│   ├── auth.store.ts          # Zustand auth state
│   ├── schedule.store.ts      # Zustand schedule state
│   └── ui.store.ts            # UI state (modals, toasts)
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx         # Main layout wrapper
│   │   ├── Header.tsx         # Top navbar with user info
│   │   └── Sidebar.tsx        # Role-based navigation
│   │
│   ├── common/
│   │   ├── StatusBadge.tsx    # Colored status pills
│   │   ├── LoadingSpinner.tsx # Loading states
│   │   ├── EmptyState.tsx     # No data placeholder
│   │   └── ConfirmModal.tsx   # Confirmation dialogs
│   │
│   ├── forms/
│   │   ├── ScheduleForm.tsx   # Create/edit schedule form
│   │   ├── LoginForm.tsx      # Login form
│   │   └── SignupForm.tsx     # Registration form
│   │
│   └── schedules/
│       ├── ScheduleTable.tsx  # Schedule list table
│       ├── ScheduleCard.tsx   # Mobile-friendly card view
│       ├── ScheduleDetail.tsx # Single schedule view
│       ├── VerificationPanel.tsx # Admin verification UI
│       ├── CourierAssignModal.tsx # Courier selection
│       └── PODUploadModal.tsx # POD acknowledgment
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx      # /login
│   │   └── SignupPage.tsx     # /signup
│   │
│   ├── originating/
│   │   ├── Dashboard.tsx      # /dashboard (originating view)
│   │   ├── CreateSchedule.tsx # /schedules/new
│   │   └── ViewSchedule.tsx   # /schedules/:id
│   │
│   ├── admin/
│   │   ├── Dashboard.tsx      # /admin/dashboard
│   │   ├── VerificationQueue.tsx # Pending schedules
│   │   ├── SortingEngine.tsx  # Verified schedules
│   │   └── PODManagement.tsx  # POD processing
│   │
│   └── management/
│       └── Dashboard.tsx      # /management/dashboard
│
├── utils/
│   ├── formatters.ts          # Date, currency, number formatting
│   ├── validators.ts          # Custom validation functions
│   └── helpers.ts             # Generic utility functions
│
├── types/
│   ├── user.types.ts          # User & auth types
│   ├── schedule.types.ts      # Schedule types
│   └── api.types.ts           # API response types
│
├── App.tsx                    # Root component with routes
├── main.tsx                   # Entry point
└── index.css                  # Global Tailwind styles
```

---

---

## 🖥️ MINIMAL UI PAGES (Routes)

### Public

- `/login` → Simple role selection (dummy auth for MVP)

### Originating Unit

- `/dashboard` → List own Schedules (table: ID, Company, Status, Date)
- `/schedules/new` → Create new Schedule form
- `/schedules/:id` → View Schedule details (read-only)

### Administrative Unit

- `/admin/dashboard` → Tabs:
  - Pending Verification (Submitted)
  - Verified (ready for sorting)
  - Sorted (ready for pickup)
  - POD Pending (PickedUp → needs POD upload)
  - Completed
- `/admin/schedules/:id` → Schedule detail with actions:
  - Verify / Return with notes
  - Edit sorting info
  - Mark Sorted
  - Log courier pickup
  - Upload POD
  - Verify POD → Mark Completed

### Management

- `/management/dashboard` → Overview metrics (total, by status, by unit)
- `/management/schedules` → List all Schedules (read-only)

---

## 📋 KEY FEATURES (Must-Have)

### 1. Schedule Submission Form (Originating)

**Fields:**

- Originating Unit (select dropdown or text)
- Liability Year (number input, e.g., 2024)
- Company Name (text)
- Address (textarea)
- LGA (select dropdown - preload common LGAs)
- Letter Count (number)
- Schedule File (file upload - accept .xlsx, .pdf, .csv)

**Validation:**

- All fields required
- Letter count > 0
- File size < 10MB
- File format check

**Actions:**

- Save as Draft (optional)
- Submit → triggers status = "Submitted"

### 2. Admin Verification Flow

**UI:**

- Card/table showing "Submitted" Schedules
- Click to open detail modal/page

**Verification Checklist:**

- [ ] Letter count matches file
- [ ] Address present
- [ ] LGA present
- [ ] Originating unit present
- [ ] File readable

**Actions:**

- ✅ Verify → Mark as "Verified"
  - Show time-based message (before/after 10 AM)
  - Confirmation toast
- ❌ Return → Open notes modal
  - Enter reason (required)
  - Save → status = "Returned"

### 3. Sorting Interface (Admin)

**UI:**

- List "Verified" Schedules
- Click to edit sorting info

**Fields:**

- Sorting Info (textarea - editable)
  - Example: "Route A: ABC LGA, XYZ LGA; Route B: DEF LGA"

**Action:**

- Save + Mark Sorted → status = "Sorted"

### 4. Courier Pickup Logging (Admin)

**UI:**

- List "Sorted" Schedules
- Checkbox selection

**Action:**

- Mark Picked Up → status = "PickedUp"
- Log pickup timestamp

### 5. POD Management (Admin)

**Upload POD:**

- File upload (image/PDF)
- OR manual text entry (recipient name, notes)
- Status → "PODReceived"

**Verify POD:**

- Side-by-side view: Schedule file vs POD
- Mark letters as:
  - ✅ Delivered
  - ❌ Returned
  - ⚠️ Partial (some delivered, some not)
- When complete → Mark as "Completed"

### 6. Status Visibility (All Roles)

**Status Badges (Color-coded):**

- 🟢 Verified, Delivered, Completed
- 🟡 Submitted, Sorted, PickedUp
- 🔴 Returned
- 🔵 PODReceived

**Timeline View (Optional but nice):**

- Show status history with timestamps

---

## 🎨 UI/UX GUIDELINES

### Design Principles

- **Clean & Minimal:** No clutter, focus on workflow
- **Mobile-Responsive:** Works on tablets for field work
- **Accessible:** WCAG 2.1 AA (color contrast, keyboard nav)

### Components to Build

- **ScheduleCard:** Compact card showing key info + status
- **ScheduleTable:** Sortable table with filters
- **StatusBadge:** Reusable status pill component
- **ActionModal:** For verification, return, POD upload
- **FileUpload:** Drag-drop or click, with preview
- **Timeline:** Visual status progression (optional)

### Animations (Framer Motion)

- Page transitions (fade in)
- Modal slide-in
- Status badge pulse (on update)
- Skeleton loaders for data fetch

---

---

## 📊 DASHBOARDS (Role-Based)

### Originating Dashboard

**Metrics:**

- Total Schedules Submitted
- Verified
- In Progress (Submitted → Sorted)
- Completed

**Table:**

- List own Schedules
- Columns: ID, Company, LGA, Letter Count, Status, Date
- Click to view details

### Admin Dashboard

**Tabs:**

1. Pending Verification (count badge)
2. Verified (ready for sorting)
3. Sorted (ready for pickup)
4. POD Pending
5. Completed

**Quick Actions:**

- Bulk verify (checkbox selection)
- Bulk mark sorted
- Export to Excel

### Management Dashboard

**Metrics:**

- Total Schedules (all units)
- By Status (pie chart)
- By Originating Unit (bar chart)
- Average processing time

**Table:**

- All Schedules (read-only)
- Filter by unit, status, date range

---

## 🔐 AUTHENTICATION IMPLEMENTATION

### Axios Interceptor Setup

```typescript
// src/services/api/axios.config.ts
import axios from "axios";
import { API_CONFIG } from "@/config/api.config";

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor - Add user unit header
apiClient.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user.unit) {
      config.headers["X-User-Unit"] = user.unit;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Auth Service

```typescript
// src/services/api/auth.service.ts
import { apiClient } from "./axios.config";
import { ENDPOINTS } from "./endpoints";
import type {
  SignupRequest,
  LoginRequest,
  AuthResponse,
} from "@/types/user.types";

export const authService = {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.SIGNUP, data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.LOGIN, data);

    // Store user data in localStorage
    const user = {
      username: response.data.username,
      email: response.data.email,
      unit: response.data.unit,
      role: determineRole(response.data.unit), // Helper function
    };

    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  },

  logout() {
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Helper: Determine role based on unit
function determineRole(unit: string): "originating" | "admin" | "management" {
  const adminUnits = ["ADMIN", "REVIEW"];
  const managementUnits = ["IT", "MANAGEMENT"];

  if (adminUnits.includes(unit.toUpperCase())) return "admin";
  if (managementUnits.includes(unit.toUpperCase())) return "management";
  return "originating";
}
```

### Auth Store (Zustand)

```typescript
// src/store/auth.store.ts
import { create } from "zustand";
import { authService } from "@/services/api/auth.service";
import type { User } from "@/types/user.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true }),

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  initialize: () => {
    const user = authService.getCurrentUser();
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },
}));
```

---

## 📝 SCHEDULE SERVICE IMPLEMENTATION

```typescript
// src/services/api/schedule.service.ts
import { apiClient } from "./axios.config";
import { ENDPOINTS } from "./endpoints";
import type {
  Schedule,
  CreateScheduleRequest,
  SubmitLettersRequest,
} from "@/types/schedule.types";

export const scheduleService = {
  // Create single letter/schedule
  async createSchedule(
    data: CreateScheduleRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post(ENDPOINTS.CREATE_SCHEDULE, data);
    return response.data;
  },

  // Submit multiple letters as batch
  async submitLetters(letterIds: string[]): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      ENDPOINTS.SUBMIT_LETTERS,
      letterIds
    );
    return response.data;
  },

  // Get all schedules (filtered by user role/unit automatically via header)
  async listSchedules(): Promise<Schedule[]> {
    const response = await apiClient.get<Schedule[]>(ENDPOINTS.LIST_SCHEDULES);
    return response.data;
  },

  // Get single schedule details
  async getSchedule(id: string): Promise<Schedule> {
    const response = await apiClient.get<Schedule>(ENDPOINTS.VIEW_SCHEDULE(id));
    return response.data;
  },

  // Admin: Verify schedule
  async verifySchedule(id: string): Promise<{ message: string }> {
    const response = await apiClient.patch(ENDPOINTS.VERIFY_SCHEDULE(id));
    return response.data;
  },

  // Admin: Reject schedule
  async rejectSchedule(id: string): Promise<{ message: string }> {
    const response = await apiClient.patch(ENDPOINTS.REJECT_SCHEDULE(id));
    return response.data;
  },

  // Admin: Update schedule (status, notes, etc.)
  async updateSchedule(
    id: string,
    data: Partial<Schedule>
  ): Promise<{ message: string }> {
    const response = await apiClient.patch(ENDPOINTS.UPDATE_SCHEDULE(id), data);
    return response.data;
  },
};
```

### Courier Service

```typescript
// src/services/api/courier.service.ts
import { apiClient } from "./axios.config";
import { ENDPOINTS } from "./endpoints";
import type {
  AssignCourierRequest,
  AcknowledgePODRequest,
} from "@/types/schedule.types";

export const courierService = {
  async assignCourier(
    data: AssignCourierRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post(ENDPOINTS.ASSIGN_COURIER, data);
    return response.data;
  },

  async acknowledgePOD(
    data: AcknowledgePODRequest
  ): Promise<{ message: string }> {
    const response = await apiClient.post(ENDPOINTS.ACKNOWLEDGE_POD, data);
    return response.data;
  },
};
```

---

## 🎯 KEY COMPONENTS IMPLEMENTATION

### 1. Status Badge Component

```typescript
// src/components/common/StatusBadge.tsx
import { motion } from "framer-motion";
import type { ScheduleStatus } from "@/types/schedule.types";

interface StatusBadgeProps {
  status: ScheduleStatus;
  className?: string;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-500" },
  submitted: { label: "Submitted", color: "bg-yellow-500" },
  verified: { label: "Verified", color: "bg-green-500" },
  rejected: { label: "Rejected", color: "bg-red-500" },
  sorted: { label: "Sorted", color: "bg-blue-500" },
  pickedUp: { label: "Picked Up", color: "bg-purple-500" },
  podReceived: { label: "POD Received", color: "bg-indigo-500" },
  completed: { label: "Completed", color: "bg-green-600" },
};

export const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white
        ${config.color} ${className}
      `}
    >
      {config.label}
    </motion.span>
  );
};
```

### 2. Schedule Form with API Integration

```typescript
// src/components/forms/ScheduleForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "react-query";
import { scheduleService } from "@/services/api/schedule.service";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const scheduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  liabilityYear: z.string().regex(/^\d{4}$/, "Must be a valid year"),
  companyName: z.string().min(2, "Company name is required"),
  lga: z.string().min(1, "LGA is required"),
  destination: z.string().min(10, "Full address is required"),
  liabilityAmount: z.number().min(0, "Amount must be positive"),
  urgency: z.enum(["MINIMAL", "MEDIUM", "HIGH", "URGENT"]),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export const ScheduleForm = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      urgency: "MINIMAL",
    },
  });

  const createMutation = useMutation(
    (data: ScheduleFormData) =>
      scheduleService.createSchedule({
        ...data,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      }),
    {
      onSuccess: () => {
        toast.success("Schedule created successfully");
        navigate("/dashboard");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to create schedule"
        );
      },
    }
  );

  const onSubmit = (data: ScheduleFormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Schedule Title
        </label>
        <input
          {...register("title")}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                     focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g., Incomplete TCC"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Company Name
        </label>
        <input
          {...register("companyName")}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="e.g., Nestle PLC"
        />
        {errors.companyName && (
          <p className="mt-1 text-sm text-red-600">
            {errors.companyName.message}
          </p>
        )}
      </div>

      {/* LGA Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          LGA (Local Government Area)
        </label>
        <select
          {...register("lga")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Select LGA</option>
          <option value="KOSOFE">KOSOFE</option>
          <option value="IKEJA">IKEJA</option>
          <option value="SURULERE">SURULERE</option>
          <option value="AKOWONJO">AKOWONJO</option>
          {/* Add all Lagos LGAs */}
        </select>
        {errors.lga && (
          <p className="mt-1 text-sm text-red-600">{errors.lga.message}</p>
        )}
      </div>

      {/* Destination Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Destination Address
        </label>
        <textarea
          {...register("destination")}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Full address"
        />
        {errors.destination && (
          <p className="mt-1 text-sm text-red-600">
            {errors.destination.message}
          </p>
        )}
      </div>

      {/* Liability Year & Amount */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Liability Year
          </label>
          <input
            {...register("liabilityYear")}
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="2026"
          />
          {errors.liabilityYear && (
            <p className="mt-1 text-sm text-red-600">
              {errors.liabilityYear.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Liability Amount (₦)
          </label>
          <input
            {...register("liabilityAmount", { valueAsNumber: true })}
            type="number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="15000000"
          />
          {errors.liabilityAmount && (
            <p className="mt-1 text-sm text-red-600">
              {errors.liabilityAmount.message}
            </p>
          )}
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Urgency Level
        </label>
        <select
          {...register("urgency")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="MINIMAL">Minimal</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                     text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium
                     hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isLoading ? "Creating..." : "Create Schedule"}
        </button>
      </div>
    </form>
  );
};
```

### 3. Admin Verification Panel

```typescript
// src/components/schedules/VerificationPanel.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { scheduleService } from "@/services/api/schedule.service";
import toast from "react-hot-toast";
import type { Schedule } from "@/types/schedule.types";

interface VerificationPanelProps {
  schedule: Schedule;
}

export const VerificationPanel = ({ schedule }: VerificationPanelProps) => {
  const queryClient = useQueryClient();
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const verifyMutation = useMutation(
    () => scheduleService.verifySchedule(schedule.scheduleId!),
    {
      onSuccess: () => {
        const currentTime = new Date();
        const cutoffTime = new Date();
        cutoffTime.setHours(10, 0, 0, 0);

        const message =
          currentTime < cutoffTime
            ? "Schedule verified for same-day pickup"
            : "Schedule verified for next business day pickup";

        toast.success(message);
        queryClient.invalidateQueries(["schedules"]);
      },
      onError: () => {
        toast.error("Failed to verify schedule");
      },
    }
  );

  const rejectMutation = useMutation(
    () => scheduleService.rejectSchedule(schedule.scheduleId!),
    {
      onSuccess: () => {
        toast.success("Schedule rejected");
        setShowRejectModal(false);
        queryClient.invalidateQueries(["schedules"]);
      },
      onError: () => {
        toast.error("Failed to reject schedule");
      },
    }
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Verification Actions</h3>

      {/* Verification Checklist */}
      <div className="mb-6 space-y-2">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm">Letter count matches schedule</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm">All addresses are present</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm">Originating unit specified</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2" />
          <span className="text-sm">Required fields complete</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => verifyMutation.mutate()}
          disabled={verifyMutation.isLoading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md
                     hover:bg-green-700 disabled:opacity-50"
        >
          ✅ Verify Schedule
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
        >
          ❌ Reject Schedule
        </button>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">Reject Schedule</h4>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full border rounded-md p-2 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectionNotes || rejectMutation.isLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-md
                           disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 ROUTING & PROTECTED ROUTES

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Toaster } from "react-hot-toast";

// Pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import OriginatingDashboard from "@/pages/originating/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import ManagementDashboard from "@/pages/management/Dashboard";
import CreateSchedule from "@/pages/originating/CreateSchedule";
import ViewSchedule from "@/pages/originating/ViewSchedule";

// Protected Route Wrapper
const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role || "")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Originating Unit Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["originating", "admin", "management"]}
            >
              <OriginatingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules/new"
          element={
            <ProtectedRoute allowedRoles={["originating"]}>
              <CreateSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedules/:id"
          element={
            <ProtectedRoute allowedRoles={["originating", "admin"]}>
              <ViewSchedule />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Management Routes */}
        <Route
          path="/management/dashboard"
          element={
            <ProtectedRoute allowedRoles={["management"]}>
              <ManagementDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Setup & Configuration (Day 1)

- [✅] Initialize Vite project with React + TypeScript
- [ ] Install all dependencies
- [ ] Configure Tailwind CSS
- [ ] Setup folder structure
- [ ] Create API configuration files
- [ ] Setup Axios interceptors with X-User-Unit header

### Phase 2: Authentication (Day 2)

- [ ] Build Login page + form
- [ ] Build Signup page + form
- [ ] Implement auth service (login, signup, logout)
- [ ] Setup Zustand auth store
- [ ] Create protected route wrapper
- [ ] Test authentication flow

### Phase 3: Originating Unit Flow (Days 3-4)

- [ ] Build dashboard (list schedules)
- [ ] Build create schedule form with validation
- [ ] Integrate POST /schedules/create API
- [ ] Build schedule detail view (read-only)
- [ ] Test create → submit flow

### Phase 4: Admin Verification (Days 5-6)

- [ ] Build admin dashboard with tabs
- [ ] Build verification panel component
- [ ] Integrate verify/reject APIs
- [ ] Add 10 AM time check logic
- [ ] Build rejection modal with notes
- [ ] Test verification workflow

### Phase 5: Courier Management (Day 7)

- [ ] Build courier assignment modal
- [ ] Integrate POST /courier/assign API
- [ ] Build pickup logging UI
- [ ] Update schedule status (sorted → pickedUp)

### Phase 6: POD Processing (Day 8)

- [ ] Build POD acknowledgment modal
- [ ] Integrate POST /courier/acknowledge-POD API
- [ ] Build POD verification UI
- [ ] Mark schedule as completed
- [ ] Show completion notification to originating unit

### Phase 7: UI/UX Polish (Days 9-10)

- [ ] Add Framer Motion animations
- [ ] Implement loading states (skeletons)
- [ ] Add error handling (toasts)
- [ ] Make responsive for mobile
- [ ] Add empty states
- [ ] Test complete end-to-end workflow

---

## 🎯 SUCCESS CRITERIA

### Functional Requirements

✅ User can signup with unit selection
✅ User can login and see role-based dashboard
✅ Originating user creates schedule → POST /schedules/create works
✅ Originating user submits letters → POST /schedules/submit works
✅ Admin sees pending schedules → GET /schedules/ filtered
✅ Admin verifies schedule → PATCH /schedules/{id}/verify works
✅ Admin rejects schedule → PATCH /schedules/{id}/reject works
✅ Admin assigns courier → POST /courier/assign works
✅ Admin logs pickup → PATCH /schedules/{id} status update
✅ Admin acknowledges POD → POST /courier/acknowledge-POD works
✅ Originating user sees completed schedule
✅ All API calls include X-User-Unit header
✅ Status transitions follow strict workflow

### Non-Functional Requirements

✅ Responsive design (mobile + desktop)
✅ Loading states on all async operations
✅ Error handling with user-friendly messages
✅ Form validation (client + server)
✅ Smooth animations (Framer Motion)
✅ Clean, intuitive UI for non-technical users
✅ No console errors
✅ TypeScript strict mode enabled

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Initialize project
npm create vite@latest lirs-dlts -- --template react-ts
cd lirs-dlts

# 2. Install dependencies
npm install react-router-dom zustand axios react-query react-hook-form zod @hookform/resolvers
npm install tailwindcss autoprefixer postcss react-icons framer-motion react-hot-toast date-fns clsx
npm install -D @types/react @types/react-dom

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Start dev server
npm run dev
```

---

## 🚫 OUT OF SCOPE (Phase 2)

❌ Email notifications (use in-app messages only)
❌ Real-time WebSockets (manual refresh for now)
❌ Advanced reporting/charts (basic metrics only)
❌ Mobile courier app (upload POD via admin for now)
❌ Payment/billing
❌ Complex user management (dummy auth)
❌ File OCR/scanning
❌ Integration with courier APIs

---

## 📝 DEVELOPMENT SEQUENCE

### Phase 1: Setup & Auth

1. Vite + React + TypeScript setup
2. Tailwind CSS + React Icons
3. React Router v6 structure
4. Zustand store (user, schedules)
5. Dummy login page

### Phase 2: Originating Unit Flow

1. Dashboard (list Schedules)
2. Create Schedule form
3. Schedule detail view (read-only)
4. File upload component

### Phase 3: Admin Verification

1. Admin dashboard (tabs by status)
2. Verification modal (approve/return)
3. Return with notes modal
4. Status update logic

### Phase 4: Sorting & Pickup

1. Sorting info edit
2. Mark as Sorted
3. Log courier pickup

### Phase 5: POD & Completion

1. POD upload form
2. POD verification interface
3. Mark as Completed
4. Completion notification

### Phase 6: Management View

1. Management dashboard
2. Metrics display
3. Read-only Schedule list

### Phase 7: Polish

1. Animations (Framer Motion)
2. Error handling
3. Loading states
4. Mobile responsive
5. Testing

---

## 📝 FINAL NOTES

### API Integration Best Practices

1. **Always include X-User-Unit header** (handled by Axios interceptor)
2. **Handle 401 errors globally** (redirect to login)
3. **Use React Query for caching** (reduce API calls)
4. **Show loading states** (better UX)
5. **Toast notifications for all actions** (feedback)

### Development Tips

1. Start with mock data in Zustand to test UI
2. Once UI works, replace with real API calls
3. Test each workflow step independently
4. Use React DevTools to debug state
5. Check Network tab for API call logs

### Common Gotchas

- Don't forget `submittedAt` in ISO format when creating schedules
- `letterIds` array in submit must be strings (not numbers)
- Status transitions are case-sensitive ('submitted' not 'Submitted')
- LGA values should match backend enum (all caps)
- Check time before showing "same day" vs "next day" message

---
