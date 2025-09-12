# Expense Tracker - Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPENSE TRACKER SYSTEM                      │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   React Client  │    │  Convex Backend │    │   External   │ │
│  │   (Frontend)    │◄──►│   (Serverless)  │◄──►│   Services   │ │
│  │                 │    │                 │    │              │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture (React + TypeScript + Vite)

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT APPLICATION                          │
│                                                                 │
│  App.tsx (Root)                                                │
│  ├── ConvexProvider (Real-time connection)                     │
│  ├── ConvexAuthProvider (Authentication state)                 │
│  └── AuthWrapper (Authentication gate)                         │
│      ├── SignInPage (Unauthenticated users)                   │
│      └── Authenticated Content                                 │
│          ├── Header (User info, navigation)                   │
│          └── ExpenseTracker (Main application)                │
│                                                                 │
│  Component Structure:                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Header    │  │ExpenseTracker│  │ AuthWrapper │           │
│  │             │  │             │  │             │           │
│  │ - User Info │  │ - Add Exp   │  │ - Sign In   │           │
│  │ - Sign Out  │  │ - List Exp  │  │ - Loading   │           │
│  │ - Actions   │  │ - Filters   │  │ - Auth Gate │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Architecture (Convex Serverless)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX BACKEND                              │
│                                                                 │
│  Authentication Layer (Convex Auth)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  auth.ts                                                │   │
│  │  ├── Google OAuth Provider                             │   │
│  │  ├── Session Management                                │   │
│  │  └── User State Sync                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Database Schema                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  schema.ts                                              │   │
│  │  ├── authTables (users, sessions, accounts)            │   │
│  │  ├── expenses (transactions, metadata)                 │   │
│  │  ├── categories (organization, budgeting)              │   │
│  │  ├── budgets (monthly limits)                          │   │
│  │  └── importJobs (CSV import tracking)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Functions Layer (Auto-generated API)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  convex/                                                │   │
│  │  ├── mutations.ts (Create, Update, Delete)             │   │
│  │  ├── queries.ts (Read, Filter, Search)                 │   │
│  │  └── actions.ts (External API calls)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW DIAGRAM                         │
│                                                                 │
│  User Interaction                                              │
│       │                                                        │
│       ▼                                                        │
│  ┌─────────────┐    WebSocket      ┌─────────────────┐         │
│  │   React     │◄─────────────────►│     Convex      │         │
│  │ Components  │   (Real-time)     │    Backend      │         │
│  └─────────────┘                   └─────────────────┘         │
│       │                                     │                  │
│       │ State Updates                       │ Database Ops     │
│       ▼                                     ▼                  │
│  ┌─────────────┐                   ┌─────────────────┐         │
│  │    Local    │                   │    Convex DB    │         │
│  │   State     │                   │   (Document     │         │
│  │ (React Hooks)│                  │   Database)     │         │
│  └─────────────┘                   └─────────────────┘         │
│                                                                 │
│  Authentication Flow:                                          │
│  User → Google OAuth → Convex Auth → Session → Protected UI   │
│                                                                 │
│  Expense Management Flow:                                      │
│  Add Expense → Validation → Mutation → DB Update → Live UI    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION SYSTEM                        │
│                                                                 │
│  Frontend Auth Flow:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. User visits app                                     │   │
│  │  2. AuthWrapper checks useCurrentUser()                │   │
│  │  3. If undefined → Show LoadingPage                    │   │
│  │  4. If null → Show SignInPage                          │   │
│  │  5. If user object → Show main app                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Google OAuth Integration:                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  User clicks "Sign in with Google"                     │   │
│  │           ▼                                             │   │
│  │  signIn("google") called                               │   │
│  │           ▼                                             │   │
│  │  Redirect to Google OAuth                              │   │
│  │           ▼                                             │   │
│  │  Google authentication                                 │   │
│  │           ▼                                             │   │
│  │  Redirect back with auth code                          │   │
│  │           ▼                                             │   │
│  │  Convex Auth processes & creates session              │   │
│  │           ▼                                             │   │
│  │  User object populated in React                        │   │
│  │           ▼                                             │   │
│  │  UI switches to authenticated state                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Session Management:                                           │
│  • Automatic token refresh                                    │
│  • Persistent login across browser sessions                   │
│  • Real-time auth state sync across tabs                     │
│  • Secure sign-out with session cleanup                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Real-time Synchronization

```
┌─────────────────────────────────────────────────────────────────┐
│                  REAL-TIME ARCHITECTURE                        │
│                                                                 │
│  Multi-User Expense Sharing:                                  │
│  ┌─────────────┐              ┌─────────────┐                  │
│  │   User A    │              │   User B    │                  │
│  │  (Partner)  │              │  (Partner)  │                  │
│  └─────┬───────┘              └─────┬───────┘                  │
│        │                            │                          │
│        │        WebSocket           │                          │
│        └─────────────┬──────────────┘                          │
│                      ▼                                         │
│            ┌─────────────────┐                                 │
│            │  Convex Server  │                                 │
│            │                 │                                 │
│            │ • Real-time DB  │                                 │
│            │ • Live Queries  │                                 │
│            │ • Automatic     │                                 │
│            │   Reactivity    │                                 │
│            └─────────────────┘                                 │
│                                                                 │
│  Live Updates:                                                 │
│  • Partner adds expense → Instantly visible to both users     │
│  • Categories created → Immediately available to all          │
│  • Budget updates → Real-time budget tracking                 │
│  • No manual refresh needed                                   │
│  • Optimistic UI updates for better UX                       │
│                                                                 │
│  Conflict Resolution:                                          │
│  • Last-write-wins for simple fields                         │
│  • Operational transform for collaborative editing           │
│  • Automatic conflict detection and resolution               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                       │
│                                                                 │
│  ┌─────────────┐                                               │
│  │    users    │                                               │
│  │             │                                               │
│  │ • name      │─────────┐                                     │
│  │ • email     │         │                                     │
│  │ • image     │         │                                     │
│  └─────────────┘         │                                     │
│                          │ (createdBy)                         │
│                          ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ categories  │    │  expenses   │    │   budgets   │        │
│  │             │◄───┤             ├───►│             │        │
│  │ • name      │    │ • amount    │    │ • monthly   │        │
│  │ • emoji     │    │ • descrip   │    │   Limit     │        │
│  │ • isDefault │    │ • account   │    │ • month     │        │
│  │ • createdBy │    │ • date      │    │ • category  │        │
│  └─────────────┘    │ • type      │    └─────────────┘        │
│                     │ • source    │                           │
│                     │ • addedBy   │                           │
│                     │ • category  │                           │
│                     └─────────────┘                           │
│                                                                 │
│  Import & Analytics:                                           │
│  ┌─────────────┐                                               │
│  │ importJobs  │                                               │
│  │             │                                               │
│  │ • filename  │                                               │
│  │ • status    │                                               │
│  │ • source    │                                               │
│  │ • totalRows │                                               │
│  │ • startedBy │───────────────────┐                          │
│  └─────────────┘                   │                          │
│                                    │                          │
│                             (references users)                │
│                                                                 │
│  Indexes for Performance:                                     │
│  • expenses: by_date, by_category, by_user, by_type          │
│  • categories: by_user, by_name                              │
│  • budgets: by_month, by_category, by_user                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Development & Deployment Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                   TECHNOLOGY STACK                             │
│                                                                 │
│  Development Tools:                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frontend: React 18 + TypeScript + Vite               │   │
│  │  Styling: CSS3 + Lucide Icons                         │   │
│  │  State: React Hooks + Convex Queries                  │   │
│  │  Build: Vite (Hot Module Replacement)                 │   │
│  │  Package Manager: npm                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Backend Services:                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Runtime: Convex (Serverless)                         │   │
│  │  Database: Convex Document DB                         │   │
│  │  Auth: Convex Auth (@convex-dev/auth)                 │   │
│  │  Real-time: WebSocket (Built into Convex)             │   │
│  │  Functions: Auto-deployed JavaScript                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  External Integrations:                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  OAuth: Google OAuth 2.0                              │   │
│  │  Import: CSV file processing                          │   │
│  │  Export: Multiple format support                      │   │
│  │  Banking: Monzo API integration (planned)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Environment Configuration:                                    │
│  • Development: npm run dev (Vite + Convex dev)              │
│  • Production: Convex Cloud deployment                       │
│  • Environment Variables: Google OAuth secrets               │
│  • Hot Reload: Vite HMR + Convex function updates           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY OVERVIEW                           │
│                                                                 │
│  Authentication Security:                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • OAuth 2.0 with Google (industry standard)          │   │
│  │  • No password storage (delegated to Google)          │   │
│  │  • JWT tokens with automatic refresh                  │   │
│  │  • Secure session management                          │   │
│  │  • CSRF protection built-in                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Data Security:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • User isolation (expenses only visible to partners) │   │
│  │  • Server-side validation on all mutations           │   │
│  │  • Input sanitization and type checking              │   │
│  │  • Encrypted data transmission (HTTPS/WSS)           │   │
│  │  • No sensitive financial data stored                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Access Control:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  • Authenticated users only                           │   │
│  │  • Row-level security on database queries            │   │
│  │  • User ID validation on all operations              │   │
│  │  • Automatic user context injection                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features & Capabilities

- **Real-time Collaboration**: Partners can see each other's expenses instantly
- **Offline-first**: Works without internet, syncs when reconnected  
- **Google Authentication**: Secure, passwordless login
- **Responsive Design**: Works on desktop and mobile devices
- **Data Import/Export**: CSV support for existing expense data
- **Category Management**: Custom categories with emoji support
- **Budget Tracking**: Monthly budget limits with real-time monitoring
- **Search & Filter**: Advanced expense filtering and search
- **Audit Trail**: Track who added what and when
- **Performance**: Sub-100ms query times with automatic caching

This architecture provides a modern, scalable, and secure expense tracking solution with real-time collaboration capabilities.