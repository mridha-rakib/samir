# Hostigo Web Administration Dashboard

A premium, modern React dashboard designed for administrators to manage users, service providers, payments, subscriptions, system notifications, support tickets, and configurations. Built with **React 18**, **Vite 6**, **Tailwind CSS v4**, and **Ant Design v5**.

---

## 🚀 Tech Stack

- **Build Tool**: Vite 6
- **UI Library**: React 18 & React Router 7
- **Styling**: Tailwind CSS v4 (integrated with `@tailwindcss/vite` compiler)
- **Component System**: Ant Design v5 (AntD)
- **Rich Text Editor**: React Quill / Jodit React (for editing T&Cs, policies, and FAQs)
- **Data Visualization**: Recharts (for dashboard stats and metrics graphs)
- **State Management**: Redux Toolkit & Redux Persist (for persistent authentication states)
- **Icons**: React Icons

---

## 🌟 Key Features

### 1. Unified Analytics & Statistics Dashboard
- Interactive charts showing monthly subscription stats, payouts, booking trends, and revenue metrics.
- At-a-glance KPI widgets tracking total users, service providers, active listings, and platform commission.

### 2. User & Provider Management
- Detail views for verified users, property owners, and service providers.
- Add, block, or modify accounts and roles.

### 3. Payment & Subscription Control
- Monitor Stripe transaction tables, payment statuses (Paid, Unpaid, Held, Released), and commissions.
- Configure and manage subscription tiers (SubscriptionPlan).

### 4. Admin Management
- Create new admin users and assign permissions.

### 5. Content Management (CMS)
- Edit application-level text fields such as Privacy Policies, Terms & Conditions, FAQs, and About Us pages using rich-text editors.

### 6. Support Ticketing & Messaging
- Review Critical, High, Medium, and Low support tickets submitted by users and assign statuses (Pending, Closed).
- System-wide notifications management interface.

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and a package manager (**pnpm**, **npm**, or **yarn**).

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_BACKEND_URL="http://localhost:5000/api/v1"
```

### 3. Run Development Server
```bash
# Install dependencies
npm install

# Run locally
npm run dev
```
Open the local URL displayed in your terminal (typically [http://localhost:5173](http://localhost:5173)).

### 4. Build for Production
To bundle the dashboard assets:
```bash
npm run build
```
The output files will be built into the `dist/` directory, ready to be hosted on Vercel, Netlify, or Nginx.

---

## 📁 Project Structure
```
hostigo-dashboard/
├── src/
│   ├── assets/             # Brand logos, icons, and static images
│   ├── components/         # Reusable UI widgets and layout modules
│   ├── layout/             # Main dashboard shell and sidebar navigation
│   ├── pages/              # Page modules (Dashboard, Auth, Payments, Users, T&Cs, etc.)
│   ├── redux/              # Redux Toolkit store, base API query, slices
│   ├── routes/             # Client-side router configuration (React Router 7)
│   ├── index.css           # Global stylesheet importing Tailwind CSS v4
│   └── main.jsx            # Application entry point
├── package.json
├── vite.config.js
└── vercel.json             # URL rewriting configuration for SPA routing
```
