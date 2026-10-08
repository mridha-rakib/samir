# Samir Booking Platform Web Portal

A modern, highly interactive consumer web portal built with **Next.js** (App Router), **React 19**, **Tailwind CSS v4**, and **Redux Toolkit**. This website serves as the primary storefront and interface for Guests (users looking to book properties), Property Owners (listing management and analytics), and Service Providers (work order schedules and execution).

---

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **State Management**: Redux Toolkit & React-Redux (for user session, booking state, and search filters)
- **Styling**: Tailwind CSS v4 (with PostCSS integration)
- **Programming Language**: TypeScript
- **Development Tooling**: ESLint, Prettier

---

## 🌟 Key Features

### 1. Unified Landing & Property Discovery
- **Search & Filters**: Search properties by location, availability dates, guests, and pricing.
- **Detailed Property Pages**: View high-quality photos/videos, amenities list, house rules, and local host recommendations.
- **Interactive Map**: View hotel and property coordinates for convenient navigation.

### 2. Multi-Dashboard Portal
The dashboard routes adapt dynamically to the user's role:
- **Guest Dashboard**: View booking schedules, manage check-in traveler lists, message property owners, download booking invoices, and post reviews.
- **Property Owner Dashboard**: Manage active listings, track occupancy, dispatch local service work orders, and review subscription statuses.
- **Service Provider Dashboard**: View active work slots, accept incoming clean/maintenance requests, and submit start/end proof videos.

### 3. Integrated Booking & Payments
- Checkout flow built on top of Stripe secure sessions.
- Detailed invoice history and payment status tracking.

### 4. Direct Chat System
- Real-time direct chat channel with owners and service providers using custom WebSocket integrations.

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and a package manager (**pnpm**, **npm**, or **yarn**).

### 2. Setup Environment Variables
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

### 3. Run Development Server
```bash
# Install dependencies
pnpm install

# Run locally
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Build & Deploy
To build the application for production:
```bash
# Build the Next.js bundle
pnpm build

# Start production server
pnpm start
```

---

## 📁 Project Structure
```
samir-website/
├── app/
│   ├── dashboard/          # Guest, Owner, and Provider dashboards
│   │   ├── guest/          # Guest-specific subpages
│   │   ├── owner/          # Owner-specific subpages
│   │   └── provider/       # Service Provider-specific subpages
│   ├── login/              # Authentication page
│   ├── privacy-policy/     # Legal pages
│   ├── layout.tsx          # Global Next.js App Layout
│   ├── globals.css         # Tailwind v4 globals stylesheet
│   └── page.tsx            # Main Landing/Home Page
├── redux/                  # Redux Toolkit global store & base APIs
├── public/                 # Static images, assets, and icons
├── package.json
└── tsconfig.json
```
