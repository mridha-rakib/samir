# Samir Booking Platform Backend

A high-performance, robust, and scalable backend system for property management and local service booking. Powered by **Node.js**, **Express**, **TypeScript**, **Prisma ORM**, and **MongoDB**, this system enables multi-role users (Guests, Owners, Service Providers, and Admins) to manage bookings, process Stripe payments, sync calendars with Airbnb via iCal, upload video evidence of services, and communicate in real-time.

---

## 🚀 Tech Stack

- **Core Framework**: Node.js & Express with TypeScript
- **Database & ORM**: MongoDB with Prisma client
- **Payment Gateway**: Stripe (including custom checkout, subscriptions, and split payouts)
- **File Storage**: AWS S3 & Cloudinary (for profile photos, travelers' passports, and proof videos)
- **Real-time Comms**: WebSockets (`ws`) & Socket.IO (for direct message channels and typing indicators)
- **Cron Jobs**: Node-Cron (for automated checkout reminder notifications, updating booking expiry status, and iCal sync checks)
- **Notifications**: Firebase Admin (FCM push notifications) & Nodemailer
- **SMS & Verification**: Twilio (for phone and OTP verification)
- **Validation**: Zod Schemas

---

## 🌟 Key Features

### 1. Multi-Role Ecosystem
- **USER (Guest)**: Browse property listings, book hotels, check-in, submit traveler info (passport/NID), chat, and review properties.
- **PROPERTY_OWNER**: Add properties, set custom seasonal pricing, manage bookings, purchase subscription plans, and hire service providers.
- **SERVICE_PROVIDER**: Register available slots, accept work orders (cleaning, key drop, maintenance), upload before/after proof videos, and receive split payouts.
- **ADMIN / SUPER_ADMIN**: Monitor application statistics, manage users, handle support reports, manage subscription plans, and handle FAQ/T&Cs.

### 2. Smart Property Management
- Manage basic amenities, smart lock codes, key box pins, Wi-Fi passwords, and property rules.
- **Dynamic Pricing**: Set customized override rates for specific date ranges (CustomPrice) and discount packages (weekly/monthly offers).
- **Local Tips**: Attach recommended local restaurants, transit instructions, and floor details categorized with custom coordinates.

### 3. Work Order Execution & Proof Videos
- Service Providers check in using a proof video (`recordProofVideoStarting`) and complete their job using an ending verification video (`recordProofVideoEnding`).
- Ensures visual verification before the property owner releases the held checkout funds.

### 4. Airbnb iCal Synchronization
- Double-booking prevention by generating dynamic `.ics` calendar files of booking schedules.
- Support for importing Airbnb iCal feeds to sync external bookings with local property calendars.

### 5. Financials, Subscriptions & Split Payments
- Secure checkout sessions for hotel and service bookings.
- Splitting payments dynamically (Stripe Capture/Split payouts) to release earnings to Service Providers while maintaining platform commissions.
- Plan subscriptions for Owners and Service Providers.

---

## 🛠️ Getting Started

### 1. Prerequisite Setup
Make sure you have **Node.js (v18+)** and **pnpm/npm** installed.

### 2. Configure Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
PORT=5000
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your-jwt-secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_BUCKET_NAME="your-s3-bucket"
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="your-twilio-token"
```

### 3. Install & Build
```bash
# Install dependencies
npm install

# Generate Prisma Client models
npx prisma generate

# Sync DB schema with MongoDB
npx prisma db push

# Run in Development mode
npm run dev

# Build production bundle
npm run build

# Start Production Server
npm start
```

---

## 📁 Project Architecture
```
src/
├── app/
│   ├── db/                 # DB client wrappers
│   ├── middlewares/        # Authentication, Error handling, JSON parser
│   ├── modules/            # Domain-driven features (Auth, Hotel, Booking, Service, etc.)
│   └── routes/             # Unified API router
├── config/                 # App configurations (Stripe, AWS, environment vars)
├── constants/              # System constants and roles
├── errors/                 # Custom AppError classes
├── helpars/                # File upload helpers, email setup, Twilio client
├── utils/                  # Cron jobs, logging, token generators, iCal parser
└── server.ts               # Server bootstrapping and WebSockets server
```

---

## 📡 API Endpoint Directory

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **POST** | `/auth/login` | Login user and generate access/refresh tokens | Public |
| **POST** | `/auth/logout` | Clear user session and logout | Public |
| **GET** | `/auth/get-me` | Retrieve current user profile details | User/Owner/Provider/Admin |
| **PUT** | `/auth/change-password` | Update account password | User/Owner/Provider/Admin |
| **POST** | `/auth/forgot-password` | Request password reset code via email | Public |
| **POST** | `/auth/reset-password` | Finalize password change with recovery OTP | Public |

### 🏨 Hotels & Properties (`/api/v1/hotels`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **GET** | `/hotels` | Retrieve list of verified hotels | Public (Cached) |
| **GET** | `/hotels/partner-hotels` | Retrieve properties owned by the logged-in partner | PROPERTY_OWNER |
| **GET** | `/hotels/:id` | Fetch specific property details | Public (Cached) |
| **POST** | `/hotels` | Register a new property listing with images and house rules | PROPERTY_OWNER |
| **PATCH** | `/hotels/:hotelId` | Modify property details, rules, or base pricing | PROPERTY_OWNER |
| **DELETE** | `/hotels/:hotelId` | Delete a property | PROPERTY_OWNER |
| **GET** | `/hotels/:hotelId/calendar.ics` | Export property booking calendar feed (iCal) | Public |
| **POST** | `/hotels/guard/:hotelId` | Assign guards to a specific hotel | PROPERTY_OWNER |

### 🛏️ Hotel Bookings (`/api/v1/hotel-booking`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **GET** | `/hotel-booking` | Fetch all bookings for a property owner | PROPERTY_OWNER |
| **GET** | `/hotel-booking/my-bookings` | Fetch bookings made by the current user | USER |
| **POST** | `/hotel-booking/:hotelId` | Initialize property room booking checkout | USER/OWNER/PROVIDER |
| **POST** | `/hotel-booking/travelers/:bookingId` | Upload and attach traveler credentials | USER/OWNER/PROVIDER/ADMIN |

### 🧹 Services (`/api/v1/services` & `/api/v1/service-booking`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **POST** | `/services` | Create local service listings (e.g. cleaning) | SERVICE_PROVIDER |
| **GET** | `/services` | Fetch all active service listings | Public |
| **POST** | `/service-booking/:serviceId` | Book a cleaning or check-in assistance service | PROPERTY_OWNER |
| **POST** | `/service-booking/:bookingId/accept` | Accept a service booking | SERVICE_PROVIDER |
| **POST** | `/service-booking/:bookingId/in-progress` | Transition service booking to in-progress | SERVICE_PROVIDER |
| **POST** | `/service-booking/:bookingId/complete-by-provider` | Mark service job complete (Upload proof video) | SERVICE_PROVIDER |
| **POST** | `/service-booking/:bookingId/confirm-by-owner` | Confirm completed service and release payment | PROPERTY_OWNER |

### 💬 Messaging (`/api/v1/messages`)
| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **GET** | `/messages/channels` | Retrieve user chat channels | User/Owner/Provider |
| **GET** | `/messages/:channelName` | Fetch conversation history for a channel | User/Owner/Provider |

---

## 🧪 Testing with Postman
Import the included `Samir backend.postman_collection.json` file in your root folder into Postman. It includes pre-configured environment schemas, query fields, and request bodies for testing every authentication, hotel booking, and service booking lifecycle endpoint.
