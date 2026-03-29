import { addDays, subDays } from 'date-fns'

const STORAGE_KEY = 'reimbursement-demo-db-v2'

const now = new Date()
const iso = (date) => date.toISOString()
const makeId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6)}`

const company = {
  id: 'company-amber-ledger',
  name: 'Amber Ledger Labs',
  country: 'India',
  baseCurrency: 'INR',
  logo: '',
  notifications: {
    submission: true,
    approval: true,
    rejection: true,
  },
  security: {
    minLength: 8,
    requireMfa: false,
  },
}

const users = [
  {
    id: 'user-admin',
    name: 'Ariana Mehra',
    email: 'admin@amberledger.io',
    password: 'password123',
    role: 'admin',
    managerId: null,
    status: 'active',
  },
  {
    id: 'user-finance',
    name: 'Noah D’Souza',
    email: 'finance@amberledger.io',
    password: 'password123',
    role: 'admin',
    managerId: null,
    status: 'active',
  },
  {
    id: 'user-manager',
    name: 'Maya Kapoor',
    email: 'manager@amberledger.io',
    password: 'password123',
    role: 'manager',
    managerId: 'user-admin',
    status: 'active',
  },
  {
    id: 'user-employee',
    name: 'Rohan Sen',
    email: 'employee@amberledger.io',
    password: 'password123',
    role: 'employee',
    managerId: 'user-manager',
    status: 'active',
  },
  {
    id: 'user-employee-2',
    name: 'Lina Brooks',
    email: 'lina@amberledger.io',
    password: 'password123',
    role: 'employee',
    managerId: 'user-manager',
    status: 'invited',
  },
]

const rules = [
  {
    id: 'rule-default-rohan',
    name: 'Rohan Travel Policy',
    description: 'Manager first, finance after review',
    employeeId: 'user-employee',
    isManagerRequired: true,
    mode: 'sequential',
    minApprovalPercentage: 100,
    approvers: [{ userId: 'user-finance', isRequired: true }],
  },
  {
    id: 'rule-default-maya',
    name: 'Manager Finance Review',
    description: 'Dual admin sign-off for manager spend',
    employeeId: 'user-manager',
    isManagerRequired: false,
    mode: 'parallel',
    minApprovalPercentage: 50,
    approvers: [
      { userId: 'user-admin', isRequired: true },
      { userId: 'user-finance', isRequired: false },
    ],
  },
]

function makeApproval({
  id,
  approverId,
  approverName,
  role,
  status,
  comment = '',
  createdAt,
  decidedAt = null,
  isRequired = false,
}) {
  return {
    id,
    approverId,
    approverName,
    role,
    status,
    comment,
    createdAt,
    decidedAt,
    isRequired,
  }
}

function makeLog(actorId, actorName, action, timestamp, note = '') {
  return {
    id: makeId('log'),
    actorId,
    actorName,
    action,
    timestamp,
    note,
  }
}

const expenses = [
  {
    id: 'exp-rohan-draft',
    employeeId: 'user-employee',
    description: 'Client lunch after implementation workshop',
    category: 'food',
    expenseDate: iso(subDays(now, 2)),
    amount: 2480,
    currency: 'INR',
    amountInBase: 2480,
    paidBy: 'Self',
    remarks: 'Pending receipts from venue.',
    receiptName: 'lunch.jpg',
    status: 'draft',
    createdAt: iso(subDays(now, 2)),
    updatedAt: iso(subDays(now, 2)),
    approvalMode: 'sequential',
    approvalChain: [],
    logs: [makeLog('user-employee', 'Rohan Sen', 'created', iso(subDays(now, 2)), 'Saved as draft')],
  },
  {
    id: 'exp-rohan-submitted',
    employeeId: 'user-employee',
    description: 'Conference travel and airport transfers',
    category: 'travel',
    expenseDate: iso(subDays(now, 7)),
    amount: 128.44,
    currency: 'USD',
    amountInBase: 10652,
    paidBy: 'Self',
    remarks: 'Flight plus taxi from client summit.',
    receiptName: 'conference-travel.png',
    status: 'submitted',
    createdAt: iso(subDays(now, 8)),
    updatedAt: iso(subDays(now, 6)),
    approvalMode: 'sequential',
    approvalChain: [
      makeApproval({
        id: 'approval-rohan-1',
        approverId: 'user-manager',
        approverName: 'Maya Kapoor',
        role: 'manager',
        status: 'approved',
        comment: 'Budget looks good.',
        createdAt: iso(subDays(now, 7)),
        decidedAt: iso(subDays(now, 6)),
        isRequired: true,
      }),
      makeApproval({
        id: 'approval-rohan-2',
        approverId: 'user-finance',
        approverName: 'Noah D’Souza',
        role: 'admin',
        status: 'pending',
        createdAt: iso(subDays(now, 6)),
        isRequired: true,
      }),
    ],
    logs: [
      makeLog('user-employee', 'Rohan Sen', 'created', iso(subDays(now, 8))),
      makeLog('user-employee', 'Rohan Sen', 'submitted', iso(subDays(now, 7))),
      makeLog('user-manager', 'Maya Kapoor', 'approved', iso(subDays(now, 6)), 'Budget looks good.'),
    ],
  },
  {
    id: 'exp-rohan-approved',
    employeeId: 'user-employee',
    description: 'Hotel stay for quarterly offsite',
    category: 'accommodation',
    expenseDate: iso(subDays(now, 17)),
    amount: 8600,
    currency: 'INR',
    amountInBase: 8600,
    paidBy: 'Company Card',
    remarks: 'One-night stay near venue.',
    receiptName: 'hotel-stay.pdf',
    status: 'approved',
    createdAt: iso(subDays(now, 19)),
    updatedAt: iso(subDays(now, 15)),
    approvalMode: 'sequential',
    approvalChain: [
      makeApproval({
        id: 'approval-rohan-approved-1',
        approverId: 'user-manager',
        approverName: 'Maya Kapoor',
        role: 'manager',
        status: 'approved',
        comment: 'Approved.',
        createdAt: iso(subDays(now, 18)),
        decidedAt: iso(subDays(now, 17)),
        isRequired: true,
      }),
      makeApproval({
        id: 'approval-rohan-approved-2',
        approverId: 'user-finance',
        approverName: 'Noah D’Souza',
        role: 'admin',
        status: 'approved',
        comment: 'Captured under travel budget.',
        createdAt: iso(subDays(now, 17)),
        decidedAt: iso(subDays(now, 15)),
        isRequired: true,
      }),
    ],
    logs: [
      makeLog('user-employee', 'Rohan Sen', 'created', iso(subDays(now, 19))),
      makeLog('user-employee', 'Rohan Sen', 'submitted', iso(subDays(now, 18))),
      makeLog('user-manager', 'Maya Kapoor', 'approved', iso(subDays(now, 17))),
      makeLog('user-finance', 'Noah D’Souza', 'approved', iso(subDays(now, 15))),
    ],
  },
  {
    id: 'exp-rohan-rejected',
    employeeId: 'user-employee',
    description: 'Design software renewal',
    category: 'software',
    expenseDate: iso(subDays(now, 24)),
    amount: 240,
    currency: 'USD',
    amountInBase: 19890,
    paidBy: 'Self',
    remarks: 'Annual renewal on personal card.',
    receiptName: 'software-renewal.png',
    status: 'rejected',
    createdAt: iso(subDays(now, 25)),
    updatedAt: iso(subDays(now, 23)),
    approvalMode: 'sequential',
    approvalChain: [
      makeApproval({
        id: 'approval-rohan-rejected-1',
        approverId: 'user-manager',
        approverName: 'Maya Kapoor',
        role: 'manager',
        status: 'rejected',
        comment: 'Please route this through procurement.',
        createdAt: iso(subDays(now, 24)),
        decidedAt: iso(subDays(now, 23)),
        isRequired: true,
      }),
    ],
    logs: [
      makeLog('user-employee', 'Rohan Sen', 'created', iso(subDays(now, 25))),
      makeLog('user-employee', 'Rohan Sen', 'submitted', iso(subDays(now, 24))),
      makeLog(
        'user-manager',
        'Maya Kapoor',
        'rejected',
        iso(subDays(now, 23)),
        'Please route this through procurement.',
      ),
    ],
  },
  {
    id: 'exp-maya-pending',
    employeeId: 'user-manager',
    description: 'Team offsite train tickets',
    category: 'travel',
    expenseDate: iso(subDays(now, 4)),
    amount: 15400,
    currency: 'INR',
    amountInBase: 15400,
    paidBy: 'Self',
    remarks: 'Advance booking for Q2 offsite.',
    receiptName: 'train-tickets.png',
    status: 'submitted',
    createdAt: iso(subDays(now, 5)),
    updatedAt: iso(subDays(now, 4)),
    approvalMode: 'parallel',
    approvalChain: [
      makeApproval({
        id: 'approval-maya-1',
        approverId: 'user-admin',
        approverName: 'Ariana Mehra',
        role: 'admin',
        status: 'pending',
        createdAt: iso(subDays(now, 4)),
        isRequired: true,
      }),
      makeApproval({
        id: 'approval-maya-2',
        approverId: 'user-finance',
        approverName: 'Noah D’Souza',
        role: 'admin',
        status: 'pending',
        createdAt: iso(subDays(now, 4)),
      }),
    ],
    logs: [
      makeLog('user-manager', 'Maya Kapoor', 'created', iso(subDays(now, 5))),
      makeLog('user-manager', 'Maya Kapoor', 'submitted', iso(subDays(now, 4))),
    ],
  },
  {
    id: 'exp-lina-approved',
    employeeId: 'user-employee-2',
    description: 'Stationery restock for client war room',
    category: 'supplies',
    expenseDate: iso(subDays(now, 10)),
    amount: 1890,
    currency: 'INR',
    amountInBase: 1890,
    paidBy: 'Self',
    remarks: 'Markers, paper, labels.',
    receiptName: 'stationery.jpg',
    status: 'approved',
    createdAt: iso(subDays(now, 12)),
    updatedAt: iso(subDays(now, 9)),
    approvalMode: 'sequential',
    approvalChain: [
      makeApproval({
        id: 'approval-lina-1',
        approverId: 'user-manager',
        approverName: 'Maya Kapoor',
        role: 'manager',
        status: 'approved',
        createdAt: iso(subDays(now, 11)),
        decidedAt: iso(subDays(now, 10)),
        isRequired: true,
      }),
      makeApproval({
        id: 'approval-lina-2',
        approverId: 'user-finance',
        approverName: 'Noah D’Souza',
        role: 'admin',
        status: 'approved',
        createdAt: iso(subDays(now, 10)),
        decidedAt: iso(subDays(now, 9)),
      }),
    ],
    logs: [
      makeLog('user-employee-2', 'Lina Brooks', 'created', iso(subDays(now, 12))),
      makeLog('user-employee-2', 'Lina Brooks', 'submitted', iso(subDays(now, 11))),
      makeLog('user-manager', 'Maya Kapoor', 'approved', iso(subDays(now, 10))),
      makeLog('user-finance', 'Noah D’Souza', 'approved', iso(subDays(now, 9))),
    ],
  },
  {
    id: 'exp-rohan-upcoming',
    employeeId: 'user-employee',
    description: 'Airport lounge and cab during client visit',
    category: 'travel',
    expenseDate: iso(addDays(now, -1)),
    amount: 3200,
    currency: 'INR',
    amountInBase: 3200,
    paidBy: 'Self',
    remarks: 'Recently added to show current month totals.',
    receiptName: 'airport-trip.png',
    status: 'approved',
    createdAt: iso(addDays(now, -1)),
    updatedAt: iso(addDays(now, -1)),
    approvalMode: 'sequential',
    approvalChain: [
      makeApproval({
        id: 'approval-rohan-upcoming-1',
        approverId: 'user-manager',
        approverName: 'Maya Kapoor',
        role: 'manager',
        status: 'approved',
        createdAt: iso(addDays(now, -1)),
        decidedAt: iso(addDays(now, -1)),
        isRequired: true,
      }),
      makeApproval({
        id: 'approval-rohan-upcoming-2',
        approverId: 'user-finance',
        approverName: 'Noah D’Souza',
        role: 'admin',
        status: 'approved',
        createdAt: iso(addDays(now, -1)),
        decidedAt: iso(now),
        isRequired: true,
      }),
    ],
    logs: [
      makeLog('user-employee', 'Rohan Sen', 'created', iso(addDays(now, -1))),
      makeLog('user-employee', 'Rohan Sen', 'submitted', iso(addDays(now, -1))),
      makeLog('user-manager', 'Maya Kapoor', 'approved', iso(addDays(now, -1))),
      makeLog('user-finance', 'Noah D’Souza', 'approved', iso(now)),
    ],
  },
]

const seedData = {
  company,
  users,
  rules,
  expenses,
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function hydrateMockDb() {
  if (typeof window === 'undefined') return clone(seedData)

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
    return clone(seedData)
  }
  return JSON.parse(existing)
}

export function readDb() {
  if (typeof window === 'undefined') return clone(seedData)
  return hydrateMockDb()
}

export function writeDb(nextDb) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDb))
  }
  return clone(nextDb)
}

export function updateDb(mutator) {
  const current = readDb()
  const draft = clone(current)
  mutator(draft)
  return writeDb(draft)
}

export function getUserById(userId) {
  return readDb().users.find((user) => user.id === userId) ?? null
}

export function createDemoToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    issuedAt: Date.now(),
  }
  return btoa(JSON.stringify(payload))
}

export function nextId(prefix) {
  return makeId(prefix)
}
