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
- Team invitations by email (Resend + Edge Function `send-invite-email`)
- Auto-join organization on register/sign-in (`accept_organization_invite`)
- Team management
  - List members
  - Change roles (`admin` / `member`)
  - Remove members
  - Resend / revoke invites
- Role-based access: Owner · Admin · Member

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
- Sync queue (`insert` / `update` / `delete` + `product_images` jobs)
- Automatic flush when back online
- Offline product image queue (persist locally → upload on sync)
- Local image preview while upload is pending
- **Reset offline data** (clears SQLite cache, queue, and local images on device)
- Offline / pending-sync status indicators

---

## User Experience

- Light / Dark / System theme (persisted)
- Skeleton loading + enter animations
- Custom confirm / alert dialogs (replaces system `Alert` for in-app flows)
- Keyboard-aware forms (`react-native-keyboard-controller`)
- Tab bar hides while keyboard is visible
- Number inputs with thousand separators (prices / quantities)
- Auth boot gate + `Stack.Protected` (no flash between login / create-org / app)

---

## Notifications

### Local (on-device)

- Low / out-of-stock alerts after product fetch or stock movement
- Cooldown via content hash (avoids spam on every refresh)
- Toggle in Settings

### Remote (team)

- Expo push token stored on `profiles.push_token`
- Android FCM via EAS credentials + `googleServicesFile`
- Database webhook on `products` **UPDATE** → Edge Function `notify-low-stock`
- Pushes to org members when stock **enters** low or out-of-stock state

---

## Screenshots

| Dashboard                                    | Products                                   | Stock                                |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| ![Dashboard](./docs/images/sf_dashboard.png) | ![Products](./docs/images/sf_products.png) | ![Stock](./docs/images/products.png) |

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

## 2b. Push / FCM (development builds)

1. Place `google-services.json` at the project root (or upload as EAS **File** env `GOOGLE_SERVICES_JSON`).
2. In `app.config.ts`:

```ts
android: {
  googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  package: "com.chantoewhan.stockflow",
}
```

> **Important:** Never commit your Service Role Key to the client application.

---

### Configure Supabase → extend list

````markdown
Also configure:

- Edge Functions
  - `send-invite-email` (Resend)
  - `notify-low-stock` (Expo Push API)
- Database webhook: `products` UPDATE → `notify-low-stock`
- RPCs
  - `update_member_role`
  - `remove_organization_member`
  - `accept_organization_invite`
- Secrets: `RESEND_API_KEY`, `INVITE_FROM_EMAIL`
- Column: `profiles.push_token`

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
````

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

### Members

Owners/Admins can:

- View members
- Promote/demote between `admin` and `member`
- Remove members (owner protected; cannot remove self)

### Invite email

1. Invite row is created under RLS
2. App invokes `send-invite-email`
3. Resend delivers the message (verified domain required for non-test recipients)
4. **Resend** action re-invokes the same function for pending invites

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

- Product list/detail load from SQLite
- Creates, updates, and stock movements are queued
- Product images are stored on device and queued as `product_images` sync jobs
- Pending synchronization is shown in the UI

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
- Invite and low-stock emails/pushes run in Edge Functions with the service role; the client never holds the service role key.
- Push registration writes only the current user’s `profiles.push_token`.

---

# Roadmap

# Roadmap

- [x] Email delivery for invitations
- [x] Team management (members, roles, remove)
- [x] Role management
- [x] Push notifications (local + remote low stock)
- [x] Offline image upload queue
- [ ] Multi-organization switcher
- [ ] EAS production builds
<!-- - [ ] App Store & Google Play release -->

---

# License
