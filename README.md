# Reimbursement Management System

Welcome to the Reimbursement Management System! This project is a full-stack application leveraging a lightning-fast **React + Vite** frontend, paired with a robust Node.js backend built using **Express.js**, **PostgreSQL**, and **Prisma ORM**. 

It is designed to solve the struggles of manual, time-consuming, and error-prone expense processes by offering a fully automated and transparent way to define custom approval flows, tackle multi-level hierarchies, and manage complex conditional thresholds.

---

## 🎯 Core Features & Problem Solving

### Auto-Company Onboarding
On the very first login/signup, a new **Company** is automatically generated. The selected country’s default currency is established as the company's base currency, and the user is instantly assigned the **Admin** role to begin configuring the environment.

### Advanced Role-Based Access Control
* **Admin:** Creates and manages Employees/Managers, assigns hierarchical reporting relationships, configures dynamic approval rules, and retains the power to view or override all expenses.
* **Manager:** Receives selective approval requests. Can approve/reject expenses (amount automatically converted and visible in the company’s default currency) and add comments. 
* **Employee:** Submits detailed expense claims (Amount, Category, Description, Date) natively in any currency. Tracks the historical status (Approved/Rejected/Pending) of their own submissions.

### Intelligent Approval Workflow
* **Sequential Routing:** If a rule assigns multiple approvers, the system handles the sequence (e.g., Step 1 → Direct Manager, Step 2 → Finance, Step 3 → Director). The expense only escalates to the next approver after the current one clears it.
* **Direct Manager Toggle:** Bypasses or mandates the direct manager's approval upfront using an `IS_MANAGER_APPROVER` flag.
* **Conditional & Hybrid Logic:** 
  * *Percentage Rule:* Set thresholds (e.g., If 60% of the assigned group approves, the expense is cleared).
  * *Specific Approver Rule:* Override triggers (e.g., If the CFO specifically hits approve, it bypasses the rest of the chain).
  * *Hybrid Flow:* Combining both workflows for dynamic and flexible escalations!

### 🌟 Standout Integrations
* **Smart OCR Receipts:** Employees can simply scan a receipt! An integrated OCR algorithm automatically reads the image and auto-generates the expense by extracting the required fields (amount, date, description, expense type, vendor/restaurant name).
* **Live Currency Conversion:** Submissions in foreign currencies are converted in real-time. We integrate `restcountries.com` for geographic currency mapping and `exchangerate-api.com` to accurately normalize expenses into the Company's base currency for managers to evaluate.

---

## 🛠️ Developer Startup Guide

Follow these concise steps to get your local environment running smoothly.

### 1. Install Dependencies
Navigate to the `backend` folder and install the required Node packages:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy the example environment template to create your local `.env` file:
```bash
cp .env.example .env
```
Ensure the following key categories are filled out in your `.env`:
* **Database Info:** `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`
* **Security:** `JWT_SECRET` (needs to be secure), `JWT_EXPIRES_IN`
* **Email integration:** `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### 3. Start the Database
Make sure Docker is running on your machine, then execute:
```bash
docker compose up -d
```

### 4. Sync the Database Schema & Generate Client
With the database running, you need to push the Prisma schema to generate the tables, and then generate the local Prisma Client so your JavaScript code can query the database:
```bash
npx prisma db push
npx prisma generate
```

### 5. Start the Server
Start the development server. We use `nodemon` so the server will automatically restart upon saving file changes:
```bash
npm run dev
```
### 6. Start the Frontend
In a new terminal, navigate to your frontend directory (assuming it's named `frontend`), install its dependencies, and start up the React + Vite dev server:
```bash
cd frontend
npm install
npm run dev
```
You should be given a fast local host URL (typically `http://localhost:5173`) to open your beautifully integrated UI in the browser!

---

## 📂 Folder Structure Highlights
* `backend/controllers/` - Route handlers mapping HTTP traffic to business logic.
* `backend/services/` - Standalone logic (e.g., the complex `approvalEngine`, OCR processing, `currencyService`).
* `backend/dbs/` - Prisma initialization and database hook configurations.
* `backend/middleware/` - Auth decoders and Role Guards.
* `backend/logs/` - Auto-generated folders where our global `winston` logger dumps runtime HTTP flows and Exception stacks (`all.log`, `error.log`).
