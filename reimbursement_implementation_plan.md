# Reimbursement Management System — Implementation Plan

> **Project:** Expense Reimbursement Management Platform  
> **Stack Recommendation:** React (Frontend) · Node.js / Express (Backend) · PostgreSQL (Database)  
> **Roles:** Admin · Manager · Employee

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [Authentication & User Management](#4-authentication--user-management)
5. [Expense Submission Module](#5-expense-submission-module)
6. [Approval Workflow Engine](#6-approval-workflow-engine)
7. [Currency Conversion Module](#7-currency-conversion-module)
8. [OCR Receipt Scanning](#8-ocr-receipt-scanning)
9. [Frontend Pages & UI Flow](#9-frontend-pages--ui-flow)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Role Permissions Matrix](#11-role-permissions-matrix)
12. [External APIs & Integrations](#12-external-apis--integrations)
13. [Implementation Phases & Timeline](#13-implementation-phases--timeline)
14. [Edge Cases & Business Logic Rules](#14-edge-cases--business-logic-rules)

---

## 1. Project Overview

### Problem Being Solved

Manual expense reimbursement processes are error-prone and lack transparency. This system provides:

- A digital expense submission workflow for employees
- Multi-level, configurable approval pipelines
- Automatic currency conversion to the company's base currency
- OCR-assisted receipt scanning to auto-fill expense forms
- Real-time status tracking across all roles

### Core User Journeys

| Role | Primary Journey |
|------|----------------|
| Admin | Signs up → Company auto-created → Creates users → Configures approval rules |
| Employee | Logs in → Submits expense (with/without receipt) → Tracks status |
| Manager | Logs in → Sees pending approvals → Approve or Reject with comments |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│   Admin Portal | Employee Dashboard | Manager Approvals  │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API / Axios
┌──────────────────────────▼──────────────────────────────┐
│                  Backend (Node.js / Express)             │
│  Auth Module | Expense Module | Approval Engine | OCR    │
└──────┬────────────────┬─────────────────┬───────────────┘
       │                │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────────────┐
│ PostgreSQL  │  │ ExchangeRate │  │ OCR Service         │
│ (Primary DB)│  │ API (Live FX)│  │ (Tesseract / Cloud) │
└─────────────┘  └─────────────┘  └─────────────────────┘
```

### Folder Structure (Recommended)

```
/project-root
  /client                  ← React frontend
    /src
      /pages               ← SignIn, SignUp, Dashboard, Approval, Admin
      /components          ← ExpenseForm, ApprovalTable, UserTable, etc.
      /context             ← AuthContext, CompanyContext
      /services            ← api.js, currency.js, ocr.js
  /server                  ← Node.js backend
    /controllers           ← auth, expense, approval, user, company
    /models                ← DB models (Sequelize or Prisma)
    /routes                ← Express route definitions
    /middleware            ← authMiddleware, roleGuard
    /services              ← approvalEngine.js, currencyService.js, ocrService.js
    /config                ← db.js, env.js
  /migrations              ← DB migration scripts
```

---

## 3. Database Schema

### Table: `companies`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | VARCHAR | Company name |
| country | VARCHAR | From signup country dropdown |
| base_currency | VARCHAR(3) | ISO code, e.g. `INR`, `USD` |
| created_at | TIMESTAMP | |

### Table: `users`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| company_id | UUID (FK → companies) | |
| name | VARCHAR | |
| email | VARCHAR (UNIQUE) | |
| password_hash | VARCHAR | bcrypt hashed |
| role | ENUM | `admin`, `manager`, `employee` |
| manager_id | UUID (FK → users, nullable) | The user's direct manager |
| created_at | TIMESTAMP | |

### Table: `expenses`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| company_id | UUID (FK → companies) | |
| employee_id | UUID (FK → users) | Submitter |
| description | TEXT | |
| category | VARCHAR | Food, Travel, Misc, etc. |
| expense_date | DATE | |
| amount | DECIMAL(12,2) | In submitted currency |
| currency | VARCHAR(3) | Currency code employee used |
| amount_in_base | DECIMAL(12,2) | Converted to company base currency |
| paid_by | VARCHAR | Who paid |
| remarks | TEXT | |
| receipt_url | VARCHAR | S3 / local file path |
| status | ENUM | `draft`, `submitted`, `approved`, `rejected` |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Table: `approval_rules`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| company_id | UUID (FK) | |
| user_id | UUID (FK → users) | Which employee this rule applies to |
| description | VARCHAR | Human-readable rule name |
| manager_id | UUID (FK → users) | Manager override for this rule |
| is_manager_approver | BOOLEAN | If true, manager must approve first |
| approvers_sequence | BOOLEAN | If true, sequential approval |
| min_approval_percentage | INTEGER | e.g. 60 means 60% must approve |
| created_at | TIMESTAMP | |

### Table: `approval_rule_approvers`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| rule_id | UUID (FK → approval_rules) | |
| user_id | UUID (FK → users) | The approver |
| sequence_order | INTEGER | Order in sequential flow |
| is_required | BOOLEAN | If true, this approver's approval is mandatory regardless of percentage |

### Table: `approval_requests`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| expense_id | UUID (FK → expenses) | |
| approver_id | UUID (FK → users) | |
| rule_id | UUID (FK → approval_rules) | |
| status | ENUM | `pending`, `approved`, `rejected` |
| comments | TEXT | Approver's comment |
| sequence_order | INTEGER | Step in the chain |
| decided_at | TIMESTAMP | When action was taken |

### Table: `expense_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| expense_id | UUID (FK → expenses) | |
| actor_id | UUID (FK → users) | Who performed the action |
| action | VARCHAR | `submitted`, `approved`, `rejected`, `created` |
| note | TEXT | Additional context |
| timestamp | TIMESTAMP | |

---

## 4. Authentication & User Management

### 4.1 Admin Signup Flow

1. Admin visits `/signup` and fills: **Name, Email, Password, Confirm Password, Country** (dropdown via REST Countries API)
2. On submit:
   - Backend creates a new `companies` record with `base_currency` derived from the selected country's currency
   - Creates the first `users` record with `role = admin`
   - Returns JWT token → frontend stores in `localStorage` / `httpOnly cookie`
3. Admin is redirected to the **Admin Dashboard**

**Country → Currency Resolution:**
```javascript
// GET https://restcountries.com/v3.1/all?fields=name,currencies
// Response example: { name: { common: "India" }, currencies: { INR: { name: "Indian Rupee", symbol: "₹" } } }
// Extract first key of currencies object as base_currency
const baseCurrency = Object.keys(country.currencies)[0]; // "INR"
```

### 4.2 User Login Flow

1. User visits `/signin` → enters Email + Password
2. Backend validates credentials, returns JWT with `{ userId, role, companyId }`
3. Frontend decodes token and routes user based on role:
   - `admin` → Admin Dashboard
   - `manager` → Approval Dashboard
   - `employee` → My Expenses Dashboard

### 4.3 Forgot Password Flow

1. User clicks **Forgot Password?** on signin page
2. Backend generates a random secure token, stores it with expiry
3. Sends email with reset link → user sets new password

### 4.4 Admin: User Management Page

The Admin can see a table with columns: **User (searchable dropdown), Role, Manager, Email, Send Password button**

- **New** button creates a blank row for entry
- Role dropdown: `Manager` or `Employee`
- Manager dropdown: dynamically populated from users in the same company
- **Send Password** button: generates a random password, emails it to the user; user can change later via profile
- Users can be created on-the-fly from this table if a name is typed that doesn't exist yet

```
POST /api/users/create
Body: { name, email, role, manager_id, company_id }
→ Creates user record, triggers "Send Password" email
```

---

## 5. Expense Submission Module

### 5.1 Employee Dashboard

The dashboard shows:
- **Summary bar** at the top with three buckets:
  - `X rs — To Submit` (Draft expenses)
  - `X rs — Waiting Approval` (Submitted, not yet approved)
  - `X rs — Approved`
- **Upload** button (for receipt OCR)
- **New** button (manual expense creation)
- **Expenses table**: Employee, Description, Date, Category, Paid By, Remarks, Amount, Status

Status badge colors:
- `Draft` → Red/orange pill
- `Submitted` → Green pill
- `Approved` → Blue pill
- `Rejected` → Grey pill

### 5.2 Expense Form (Create / View)

Fields:
- **Description** (text)
- **Expense Date** (date picker)
- **Category** (dropdown: Food, Travel, Accommodation, Miscellaneous, etc.)
- **Paid By** (dropdown of users or free text)
- **Total Amount** (numeric input)
- **Currency** (dropdown — employee can choose any currency, not just company base)
- **Remarks** (optional text)
- **Attach Receipt** button (file upload / camera)

Status trail shown at top: `Draft → Waiting Approval → Approved`

Approval log table at bottom:
| Approver | Status | Time |
|----------|--------|------|
| Sarah | Approved | 12:44 4th Oct, 2025 |

**Submit Button Behavior:**
- Visible only when status is `draft`
- On submit:
  - Status changes to `submitted`
  - Form becomes **read-only**
  - Submit button is hidden
  - Approval workflow is triggered (see Section 6)

### 5.3 Expense State Machine

```
[Draft] ──► [Submitted] ──► [Approved]
                │
                └──► [Rejected]
```

- Employee can edit only in `Draft`
- Once `Submitted`, record is read-only for employee
- Admin can override at any stage

---

## 6. Approval Workflow Engine

This is the most complex module. It must handle:

1. Simple single-approver
2. Sequential multi-step approvers
3. Parallel (non-sequential) multi-approver with percentage threshold
4. "Required" approver (their approval is mandatory regardless of percentage)
5. Is Manager Approver (manager approves first, before all others)
6. Hybrid: Combination of percentage + required approver

### 6.1 Approval Rule Configuration (Admin)

Admin creates an `approval_rule` per user (or per category). The rule form contains:

**Left Panel:**
- User (who the rule applies to)
- Description (rule name)
- Manager (override dropdown — defaults to user's assigned manager)

**Right Panel:**
- `Is Manager an Approver?` checkbox — if checked, expense goes to manager first
- Approvers list (up to N rows): each row has User + Required checkbox
  - `Required` = if ticked, this approver's approval is mandatory regardless of percentage logic
- `Approvers Sequence` checkbox:
  - If ticked: Sequential mode — request goes to approver 1 first; only after their action, it goes to approver 2, etc.
  - If unticked: Parallel mode — all approvers receive the request simultaneously
- `Minimum Approval Percentage` — e.g. 60 means 60% of approvers must approve for the expense to be auto-approved

### 6.2 Approval Engine Logic (Backend Service)

```javascript
// approvalEngine.js

async function triggerApprovalFlow(expenseId) {
  const expense = await Expense.findById(expenseId);
  const rule = await ApprovalRule.findByUserId(expense.employee_id);

  let approverQueue = [];

  // Step 1: If manager is approver, prepend manager to queue
  if (rule.is_manager_approver) {
    approverQueue.push({ user_id: rule.manager_id, sequence_order: 0, is_required: true });
  }

  // Step 2: Add configured approvers
  const ruleApprovers = await ApprovalRuleApprovers.findByRule(rule.id);
  ruleApprovers.forEach((a, idx) => {
    approverQueue.push({ ...a, sequence_order: idx + 1 });
  });

  // Step 3: Create approval_requests records
  if (rule.approvers_sequence) {
    // Sequential: create only the first request now
    await createApprovalRequest(expenseId, approverQueue[0]);
  } else {
    // Parallel: create all requests at once
    await Promise.all(approverQueue.map(a => createApprovalRequest(expenseId, a)));
  }
}

async function handleApprovalDecision(approvalRequestId, decision, comment) {
  const request = await ApprovalRequest.findById(approvalRequestId);
  await request.update({ status: decision, comments: comment, decided_at: new Date() });
  await ExpenseLog.create({ expense_id: request.expense_id, actor_id: request.approver_id, action: decision });

  // Check if expense should be auto-resolved
  await evaluateExpenseStatus(request.expense_id);
}

async function evaluateExpenseStatus(expenseId) {
  const rule = await getRuleForExpense(expenseId);
  const requests = await ApprovalRequest.findAllByExpense(expenseId);

  const total = requests.length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  // Check required approvers — if any required approver rejected, auto-reject
  const requiredRejected = requests.some(r => r.is_required && r.status === 'rejected');
  if (requiredRejected) {
    return await Expense.update(expenseId, { status: 'rejected' });
  }

  // Check required approvers approved
  const allRequiredApproved = requests
    .filter(r => r.is_required)
    .every(r => r.status === 'approved');

  // Check percentage threshold
  const approvalPercentage = (approved / total) * 100;
  const percentageMet = approvalPercentage >= rule.min_approval_percentage;

  if (allRequiredApproved && percentageMet) {
    return await Expense.update(expenseId, { status: 'approved' });
  }

  // Sequential: trigger next in queue if current one approved
  if (rule.approvers_sequence) {
    const current = requests.find(r => r.status === 'pending');
    if (!current) {
      const nextInSequence = getNextApprover(rule, requests);
      if (nextInSequence) await createApprovalRequest(expenseId, nextInSequence);
    }
  }
}
```

### 6.3 Manager Approval View

The manager sees a table: **Approvals to Review**

Columns: Approval Subject | Request Owner | Category | Request Status | Total Amount (company currency) | Approve button | Reject button

- Amount is always shown in **company's base currency** with conversion note (e.g., `$67 (in INR) = 49896`)
- After Approve/Reject:
  - Row becomes **read-only**
  - Action buttons disappear
  - Status cell is updated with `Approved` or `Rejected`

---

## 7. Currency Conversion Module

### 7.1 How It Works

- Employee submits expense in any currency (e.g., USD)
- Backend fetches live exchange rate at time of submission
- Converts to company's `base_currency` and stores `amount_in_base`
- Manager always sees amounts in company base currency

### 7.2 Currency Service

```javascript
// currencyService.js

const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

async function convertToBaseCurrency(amount, fromCurrency, baseCurrency) {
  if (fromCurrency === baseCurrency) return amount;

  const response = await fetch(`${BASE_URL}/${fromCurrency}`);
  const data = await response.json();
  const rate = data.rates[baseCurrency];

  return parseFloat((amount * rate).toFixed(2));
}

// Called during expense submission:
const amountInBase = await convertToBaseCurrency(
  expense.amount,
  expense.currency,     // e.g. USD
  company.base_currency // e.g. INR
);
```

### 7.3 Countries & Currencies Dropdown

```javascript
// Used on Admin Signup page (country selector)
const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
const countries = await response.json();
// Build dropdown: { label: "India (INR)", value: "IN", currency: "INR" }
const options = countries
  .filter(c => c.currencies)
  .map(c => ({
    label: `${c.name.common} (${Object.keys(c.currencies)[0]})`,
    value: c.name.common,
    currency: Object.keys(c.currencies)[0]
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
```

---

## 8. OCR Receipt Scanning

### 8.1 How It Works

1. Employee clicks **Upload** on the dashboard
2. Image/PDF of receipt is uploaded
3. OCR service extracts: amount, date, merchant name, category (best guess), description
4. A pre-filled expense form opens with extracted values
5. Employee reviews and corrects values, then saves/submits

### 8.2 OCR Options

| Option | Library | Notes |
|--------|---------|-------|
| Browser-side (free) | `Tesseract.js` | Works without a backend OCR service |
| Server-side (accurate) | `node-tesseract-ocr` | Better for scanned PDFs |
| Cloud (best accuracy) | Google Vision API / AWS Textract | Paid, production-grade |

### 8.3 Implementation with Tesseract.js (Frontend)

```javascript
// ocrService.js (frontend)
import Tesseract from 'tesseract.js';

export async function extractReceiptData(imageFile) {
  const { data: { text } } = await Tesseract.recognize(imageFile, 'eng');

  // Parse extracted text using regex patterns
  const amountMatch = text.match(/(?:total|amount|grand total)[:\s]*[\$₹€£]?\s*([\d,]+\.?\d*)/i);
  const dateMatch = text.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);

  return {
    amount: amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null,
    date: dateMatch ? dateMatch[1] : null,
    description: extractMerchantName(text), // heuristic based on first lines
    rawText: text
  };
}
```

### 8.4 Claude Vision API (AI-powered, recommended)

For best results, send the receipt image to Claude's vision API with a structured prompt to return JSON with: `amount`, `currency`, `date`, `merchant_name`, `category`, `description`.

---

## 9. Frontend Pages & UI Flow

### 9.1 Pages List

| Route | Component | Access |
|-------|-----------|--------|
| `/signup` | AdminSignup | Public |
| `/signin` | SignIn | Public |
| `/dashboard` | EmployeeDashboard | Employee |
| `/expenses/new` | ExpenseForm | Employee |
| `/expenses/:id` | ExpenseDetail | Employee |
| `/approvals` | ApprovalDashboard | Manager |
| `/admin/users` | UserManagement | Admin |
| `/admin/rules` | ApprovalRuleConfig | Admin |
| `/admin/rules/new` | ApprovalRuleForm | Admin |

### 9.2 Page-by-Page Breakdown

#### Admin Signup Page (`/signup`)
- Fields: Name, Email, Password, Confirm Password, Country (dropdown from REST Countries API)
- On submit: creates company + admin user
- Shows validation errors inline

#### Sign In Page (`/signin`)
- Fields: Email, Password
- Login button
- Links: "Don't have an account? Signup" · "Forgot password?"
- Role-based redirect after successful auth

#### Admin — User Management (`/admin/users`)
- Table: User | Role | Manager | Email | Send Password
- **New** button adds a blank row
- Inline editing with dropdowns for Role and Manager
- **Send Password** emails a generated password to the user

#### Admin — Approval Rules (`/admin/rules`)
- List of all configured approval rules
- **New Rule** button

#### Admin — Approval Rule Form (`/admin/rules/new` or `/admin/rules/:id`)

Left panel:
- User field (who the rule applies to)
- Rule description
- Manager dropdown (defaults to user's manager, overridable)

Right panel:
- `Is Manager an Approver?` toggle
- Approvers table (add rows with User + Required checkbox)
- `Approvers Sequence` toggle with explanation
- `Minimum Approval Percentage` input field

#### Employee Dashboard (`/dashboard`)
- Summary: To Submit | Waiting Approval | Approved (amounts in company currency)
- Upload and New buttons
- Expenses table with status badges
- Click row → opens ExpenseDetail

#### Expense Form (`/expenses/new`)
- Attach Receipt button at top
- Status trail: Draft > Waiting Approval > Approved
- All fields: Description, Expense Date, Category, Paid By, Total Amount, Currency, Remarks
- Submit button (visible only in Draft state)
- After submit: form goes read-only, submit hidden, approval log appears below

#### Manager Approval Dashboard (`/approvals`)
- Table: Approval Subject | Request Owner | Category | Request Status | Total Amount (base currency) | Approve | Reject
- Amount shows conversion info: `$67 (in INR) = 49896`
- Post-action: buttons disappear, row becomes read-only with final status

### 9.3 State Management

Use **React Context API** or **Redux** for:
- `AuthContext` — current user, role, company info, JWT
- `ExpenseContext` — current expense list, filter states
- `CompanyContext` — base currency, company settings

---

## 10. API Endpoints Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Admin signup → creates company + user |
| POST | `/api/auth/login` | Returns JWT |
| POST | `/api/auth/forgot-password` | Sends reset email |
| POST | `/api/auth/reset-password` | Resets password with token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users in company (Admin only) |
| POST | `/api/users` | Create user (Admin only) |
| PUT | `/api/users/:id` | Update user role/manager |
| POST | `/api/users/:id/send-password` | Email generated password |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get expenses (filtered by role) |
| POST | `/api/expenses` | Create new expense (draft) |
| PUT | `/api/expenses/:id` | Update expense (draft only) |
| POST | `/api/expenses/:id/submit` | Submit for approval |
| GET | `/api/expenses/:id/logs` | Get approval history log |

### Approvals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approvals/pending` | Manager: list pending approvals |
| POST | `/api/approvals/:id/approve` | Approve with optional comment |
| POST | `/api/approvals/:id/reject` | Reject with comment |

### Approval Rules (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rules` | List all rules |
| POST | `/api/rules` | Create new rule |
| PUT | `/api/rules/:id` | Update rule |
| DELETE | `/api/rules/:id` | Delete rule |

### Currency

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/currency/countries` | Proxied countries+currencies list |
| GET | `/api/currency/convert?from=USD&to=INR&amount=100` | Real-time conversion |

---

## 11. Role Permissions Matrix

| Action | Employee | Manager | Admin |
|--------|----------|---------|-------|
| Sign up (create company) | ✗ | ✗ | ✓ |
| Create users | ✗ | ✗ | ✓ |
| Assign roles | ✗ | ✗ | ✓ |
| Configure approval rules | ✗ | ✗ | ✓ |
| Override approvals | ✗ | ✗ | ✓ |
| View all company expenses | ✗ | ✗ | ✓ |
| Submit expense | ✓ | ✓ | ✓ |
| View own expenses | ✓ | ✓ | ✓ |
| View team expenses | ✗ | ✓ | ✓ |
| Approve / Reject expenses | ✗ | ✓ | ✓ |
| View approval queue | ✗ | ✓ | ✓ |
| Upload receipt (OCR) | ✓ | ✓ | ✓ |

---

## 12. External APIs & Integrations

### 12.1 REST Countries API

- **URL:** `https://restcountries.com/v3.1/all?fields=name,currencies`
- **Usage:** Populate country dropdown on Admin Signup page
- **When to call:** Once on page load; cache result in state
- **Response shape:**
  ```json
  [{ "name": { "common": "India" }, "currencies": { "INR": { "name": "Indian Rupee" } } }]
  ```

### 12.2 Exchange Rate API

- **URL:** `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}`
- **Usage:** Convert expense amount to company's base currency at time of submission
- **Example:** `GET /v4/latest/USD` → returns rates for all currencies
- **When to call:** At expense submission time; do NOT cache for long (rates change)
- **Fallback:** If API is unreachable, store expense with raw currency and flag for manual conversion

### 12.3 Email Service

- **Recommended:** Nodemailer + SendGrid or AWS SES
- **Used for:**
  - Sending generated password to newly created users
  - Notifying approvers of pending requests
  - Notifying employees of approval/rejection decisions

---

## 13. Implementation Phases & Timeline

### Phase 1 — Foundation (Week 1–2)

- [ ] Project scaffolding (React + Node.js)
- [ ] PostgreSQL schema creation and migrations
- [ ] Admin Signup with country selection and company creation
- [ ] Sign In / Sign Out with JWT
- [ ] Role-based route protection (middleware + frontend guards)

### Phase 2 — User & Expense Core (Week 3–4)

- [ ] Admin User Management page (create, assign roles, set manager, send password)
- [ ] Employee Expense dashboard (table + summary cards)
- [ ] Expense creation form (manual entry, all fields)
- [ ] Draft save and Submit functionality
- [ ] Expense status state machine
- [ ] Expense log (audit trail)

### Phase 3 — Approval Workflow (Week 5–6)

- [ ] Approval Rule configuration UI (Admin)
- [ ] Approval engine backend service (sequential + parallel + percentage + required)
- [ ] Is Manager Approver logic
- [ ] Manager Approval dashboard
- [ ] Approve / Reject with comments
- [ ] Post-decision read-only state and button hiding

### Phase 4 — Currency & OCR (Week 7)

- [ ] Country → Currency resolution on signup
- [ ] Live currency conversion on expense submission
- [ ] Currency display in Manager view
- [ ] OCR receipt upload (Tesseract.js frontend implementation)
- [ ] Auto-fill expense form from OCR output
- [ ] Review / edit pre-filled values before save

### Phase 5 — Polish & Edge Cases (Week 8)

- [ ] Forgot password / reset password flow
- [ ] Responsive UI polish
- [ ] Error handling and loading states
- [ ] Admin approval override
- [ ] Notification emails (approval requests, decisions)
- [ ] Testing (unit + integration for approval engine)

---

## 14. Edge Cases & Business Logic Rules

### Expense Submission

- An expense in `draft` state can be edited; once `submitted` it is immutable for the employee
- If no approval rule exists for a user, admin should be notified or a default rule should be applied
- Currency conversion rate must be recorded at the time of submission, not at approval time

### Approval Engine

- If `is_manager_approver = true` and the user has no manager set, the system must warn admin
- In sequential mode: if an approver at step N rejects, stop the chain and auto-reject the expense
- In sequential mode: if an approver at step N approves and they are `required`, continue to step N+1
- In parallel mode: if `min_approval_percentage` is 100%, all must approve
- In parallel mode: if a `required` approver rejects, auto-reject immediately regardless of others
- Hybrid scenario — e.g., `required=CFO` AND `percentage=60%`: both conditions must be satisfied
- If all approvers have responded but threshold not met, mark expense as `rejected`
- An approver should not be able to approve their own expense even if assigned in the rule

### User Management

- Admin cannot delete themselves
- Changing a user's role from Manager to Employee should not affect in-progress approvals they are assigned to
- If a manager is deleted or deactivated, their pending approvals should be reassigned

### Currency

- If exchange rate API fails, log the error and store raw amount with a `pending_conversion` flag
- Conversion is done once at submission time; the rate is frozen after that

### OCR

- OCR output should always be presented as editable suggestions, not auto-saved
- If OCR confidence is low, display a warning banner on the pre-filled form
- Supported file types: JPEG, PNG, PDF

---

*This implementation plan covers the full system from database design to frontend UX. Each section maps directly to the wireframes provided in the project mockups. The approval engine (Section 6) is the most business-critical component and should receive dedicated QA attention with edge-case test suites.*
