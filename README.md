# 🛍️ RJ Shop — Professional MERN E-Commerce System

Welcome to the **RJ Shop** repository! This is a complete, production-ready MERN e-commerce system that includes a dynamic storefront, a comprehensive admin metrics/management dashboard, a backend REST API, and a cross-platform React Native mobile app.

---

## 🏗️ Project Structure

The project is structured as a monorepo containing the following components:

```text
rj/
├── backend/          # Express REST API (Node/MongoDB, JWT, Razorpay, Shiprocket)
├── frontend/         # Vite + React client (Customer Storefront with Tailwind CSS)
├── admin-panel/      # Vite + React client (Admin Dashboard with Tailwind CSS)
├── mobile-app/       # Expo React Native App (iOS & Android)
└── README.md         # Documentation
```

---

## 🛠️ Tech Stack & Key Features

*   **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth.
*   **Storefront & Admin:** Vite, React, Tailwind CSS, Axios, Lucide Icons.
*   **Mobile App:** React Native, Expo, React Navigation, AsyncStorage.
*   **Payment Gateway:** Razorpay API (with webhook signature verification).
*   **Shipping Hooks:** Shiprocket API wrapper.
*   **Aesthetics:** Sleek dark modes, glassmorphism, responsive grid layouts, and custom loaders.

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18+)
*   [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on port `27017`)

---

### 1️⃣ Database Setup & Seeding

1. Make sure your MongoDB service is running locally on port `27017`.
2. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
3. Create your `.env` file from the template (a default configuration is already provided in local workspace):
   ```bash
   cp .env.example .env
   ```
4. Seed the database with default products, an admin account, and a customer account:
   ```bash
   node seed.js
   ```

---

### 2️⃣ Running the Backend API

1. In the `backend/` directory, install packages and start the development server:
   ```bash
   npm install
   npm run dev
   ```
2. The server will launch at: **`http://localhost:5000`**
3. Verify it is running by checking the health endpoint: `http://localhost:5000/api/health`

---

### 3️⃣ Running the Storefront

1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Install packages and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. The storefront will launch (typically at **`http://localhost:5173`** or **`http://localhost:5175`**).

---

### 4️⃣ Running the Admin Panel

1. Navigate to the `admin-panel/` directory:
   ```bash
   cd ../admin-panel
   ```
2. Install packages and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. The dashboard will launch (typically at **`http://localhost:5176`**).

---

### 5️⃣ Running the Mobile App

1. Navigate to the `mobile-app/` directory:
   ```bash
   cd ../mobile-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with the **Expo Go** app on your Android or iOS device to run the app.

---

## 🔑 Default Test Accounts

Use the following pre-seeded credentials to test features like checkouts and admin metrics:

### 👤 Admin Account
*   **Access Portals:** Admin Panel (`http://localhost:5176`)
*   **Email:** `admin@rjshop.com`
*   **Password:** `admin123`

### 🛍️ Customer Account
*   **Access Portals:** Storefront & Mobile App
*   **Email:** `customer@rjshop.com`
*   **Password:** `customer123`
*   **Default Address:** Pre-seeded address in New Delhi, India.

---

## 🔒 Security & Best Practices

*   **Secrets Protection:** Sensitive API keys (Razorpay, Shiprocket, JWT Secret) are stored in `.env` and are ignored by git via the root `.gitignore`.
*   **RAW Body Parsing:** Webhooks from Razorpay are verified using HMAC signatures with raw request bodies before any actions are taken.
