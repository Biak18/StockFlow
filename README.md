# StockFlow

> **Production-oriented inventory management mobile app for small businesses.**

Track products, stock movements, categories, suppliers, and team access with offline support and a multi-tenant organization model.

---

# Features

## Authentication & Workspace

- Email/password authentication (Supabase Auth)
- User registration
- Login
- Forgot password
- Multi-tenant organizations (workspaces)
- Row Level Security (RLS)
- Create organization on first launch
- Team invitations via email (auto-join on sign-in)
- Role-based access
  - Owner
  - Admin
  - Member

---

## Inventory Management

- Product CRUD
  - SKU
  - Barcode
  - Cost price
  - Selling price
  - Stock quantity
  - Minimum stock
- Product image upload (Supabase Storage)
- Categories
- Suppliers
- Stock In
- Stock Out
- Stock Adjustment
- Inventory history
- Barcode scanning
  - Find existing product
  - Create new product with pre-filled barcode
- Dashboard
  - Inventory value
  - Low stock
  - Out of stock
  - Recent activity
- Reports
  - Inventory valuation
  - Low stock report
  - CSV export

---

## Offline Support

- SQLite local database
- Offline product cache
- Sync queue
- Automatic synchronization when back online
- Offline status indicators

---

## User Experience

- Light / Dark / System theme
- Theme persistence
- Skeleton loading
- Smooth screen animations
- Custom confirmation dialogs
- Keyboard-aware forms
- Tab bar hides while keyboard is visible

---

# Tech Stack

| Layer                | Technology                                |
| -------------------- | ----------------------------------------- |
| **Framework**        | React Native, Expo SDK 56, Expo Router    |
| **Language**         | TypeScript                                |
| **Backend**          | Supabase (PostgreSQL, Auth, Storage, RLS) |
| **State Management** | Zustand                                   |
| **Forms**            | React Hook Form + Zod                     |
| **Lists**            | FlashList                                 |
| **Animations**       | React Native Reanimated                   |
| **Offline Storage**  | Expo SQLite + Sync Queue                  |
| **Keyboard**         | react-native-keyboard-controller          |

---

# Architecture

Feature-based architecture designed for scalability.

```text
src/
├── app/                 # Expo Router screens
├── components/          # Shared UI components
├── features/            # Feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── categories/
│   ├── suppliers/
│   └── settings/
├── services/            # API, Supabase, Sync, Theme
├── stores/              # Zustand stores
├── database/            # SQLite database
├── theme/               # Design system
├── types/
└── utils/
```

### Data Flow

#### Online

```text
UI
    ↓
Feature Service / Repository
    ↓
Supabase
```

#### Offline

```text
UI
    ↓
Repository
    ↓
SQLite
    ↓
Sync Queue
    ↓
Automatic Sync
```

### Multi-Tenant Architecture

All business data is scoped by `organization_id`.

Access is controlled through:

- `organization_members`
- Row Level Security (RLS)

---

# Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Supabase project
- Android Emulator, iOS Simulator, or physical device

---

# Getting Started

## 1. Install Dependencies

```bash
npm install

# or

yarn
```

---

## 2. Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

> **Important:** Never commit your Service Role Key to the client application.

---

## 3. Configure Supabase

Create or migrate the following tables:

- profiles
- organizations
- organization_members
- organization_invites
- products
- categories
- suppliers
- inventory_transactions

Configure:

- Row Level Security (RLS)
- Helper functions
  - `is_org_member`
  - `is_org_admin`
- RPC Functions
  - `create_organization_with_owner`
  - `accept_organization_invite`
- Storage bucket for product images
- Storage policies

---

## 4. Start the App

```bash
npx expo start
```

Then:

- Press **i** for iOS
- Press **a** for Android
- Or scan the QR code using Expo Go or a Development Build

> Barcode scanning, camera access, and offline functionality work best using a Development Build or a physical device.

---

# Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run lint       # Run ESLint
```

---

# App Structure

```text
(auth)/
├── login
├── register
├── forgot-password
└── create-organization

(app)/
├── index                  # Dashboard
├── products/
│   ├── index
│   ├── create
│   ├── [id]
│   ├── edit
│   └── stock
├── categories/
├── suppliers/
└── settings/
```

### Bottom Navigation

- Dashboard
- Products
- Settings

Additional modules (Categories, Suppliers, Reports, Team Management) are accessible through Settings.

---

# Organizations & Team Invites

### New User

If the user has:

- no organization
- no pending invitation

They are prompted to create a new organization and automatically become the **Owner**.

---

### Team Invitations

Owners and Admins can invite members via email.

Workflow:

```text
Owner/Admin
        ↓
Send Invitation
        ↓
User Registers or Signs In
        ↓
Invitation Accepted
        ↓
Organization Membership Created
```

Each organization's data is completely isolated using Row Level Security.

---

# Offline Behavior

When offline:

- Product list loads from SQLite
- Product details load from SQLite
- Create, Update, and Stock Movements are queued
- Pending synchronization is displayed

Current limitation:

- Product image uploads require an internet connection.

---

# Theme

Supported modes:

- Light
- Dark
- System

Theme preference is persisted locally and applied before the application renders.

---

# Security

- Row Level Security (RLS) protects all tenant data.
- Client applications use only the Supabase Anon Key.
- Privileged operations use `SECURITY DEFINER` RPC functions.
- Server-side policies validate roles before allowing organization management operations.

---

# Roadmap

- [ ] Email delivery for invitations
- [ ] Team management
- [ ] Role management
- [ ] Multi-organization switcher
- [ ] Push notifications
- [ ] Offline image upload queue
- [ ] EAS production builds
- [ ] App Store & Google Play release

---

# License

Private project.

Adjust the license as needed before public distribution.
