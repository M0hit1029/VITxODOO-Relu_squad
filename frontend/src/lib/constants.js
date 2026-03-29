export const ROLES = ['admin', 'manager', 'employee']

export const CATEGORIES = [
  { value: 'food', label: 'Food & Dining', emoji: '🍔', keywords: ['food', 'meal', 'restaurant'] },
  { value: 'travel', label: 'Travel', emoji: '✈️', keywords: ['flight', 'taxi', 'travel', 'uber'] },
  { value: 'accommodation', label: 'Accommodation', emoji: '🏨', keywords: ['hotel', 'stay', 'room'] },
  { value: 'software', label: 'Software/Tools', emoji: '💻', keywords: ['software', 'license', 'saas'] },
  { value: 'supplies', label: 'Supplies', emoji: '📦', keywords: ['supplies', 'stationery'] },
  { value: 'utilities', label: 'Utilities', emoji: '🔧', keywords: ['utility', 'internet', 'phone'] },
  { value: 'misc', label: 'Miscellaneous', emoji: '📋', keywords: ['misc', 'other'] },
]

export const PAID_BY_OPTIONS = ['Self', 'Company Card', 'Other']

export const NAVIGATION_BY_ROLE = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
    { label: 'Users', path: '/admin/users', icon: 'Users' },
    { label: 'Expenses', path: '/admin/expenses', icon: 'ReceiptText' },
    { label: 'Approval Rules', path: '/admin/rules', icon: 'Workflow' },
    { label: 'Company Settings', path: '/admin/settings', icon: 'Settings' },
  ],
  manager: [
    { label: 'Dashboard', path: '/manager/dashboard', icon: 'LayoutDashboard' },
    { label: 'Approval Queue', path: '/approvals', icon: 'ListTodo' },
    { label: 'My Expenses', path: '/expenses', icon: 'WalletCards' },
  ],
  employee: [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'My Expenses', path: '/expenses', icon: 'WalletCards' },
    { label: 'New Expense', path: '/expenses/new', icon: 'FilePlus2' },
  ],
}

export const LANDING_FEATURE_STRIP = [
  'Multi-level Approvals',
  'OCR Receipt Scanning',
  'Live Currency Conversion',
  'Role-based Access',
  'Audit Trail',
  'Email Notifications',
]

export const LANDING_FEATURE_CARDS = [
  {
    title: 'Smart Approvals',
    description: 'Blend manager-first approvals with finance checks, percentage thresholds, and required approvers.',
    accent: 'from-primary/30 via-primary/10 to-transparent',
  },
  {
    title: 'Receipt OCR',
    description: 'Scan receipts client-side, review extracted fields, and push clean data into the form instantly.',
    accent: 'from-success/25 via-primary/10 to-transparent',
  },
  {
    title: 'Multi-currency',
    description: 'Capture original spend, convert into the company base currency, and keep the value frozen for audit.',
    accent: 'from-warning/30 via-primary/10 to-transparent',
  },
]

export const ROLE_SHOWCASE = [
  {
    value: 'employee',
    label: 'Employee',
    title: 'Submit in minutes, not after lunch.',
    bullets: [
      'Drag in a receipt and prefill the form.',
      'Watch approvals move in real time.',
      'See converted totals before you submit.',
    ],
  },
  {
    value: 'manager',
    label: 'Manager',
    title: 'Approve with context, not guesswork.',
    bullets: [
      'See original and base currency side by side.',
      'Act inline without losing your place.',
      'Track team spend before it surprises you.',
    ],
  },
  {
    value: 'admin',
    label: 'Admin',
    title: 'Own policy, visibility, and overrides.',
    bullets: [
      'Configure multi-step workflows visually.',
      'Manage users and reporting from one workspace.',
      'Keep company settings and notifications aligned.',
    ],
  },
]

export const TESTIMONIALS = [
  {
    quote:
      'We replaced spreadsheet chaos with a system our team actually enjoys using. Finance stopped chasing people in week one.',
    name: 'Nisha Rao',
    role: 'Finance Lead, Northstar Ops',
  },
  {
    quote:
      'The approval queue feels calm even on busy days. Managers move faster because every decision has the right context.',
    name: 'Marcus Lee',
    role: 'COO, Lattice Forge',
  },
  {
    quote:
      'The OCR flow alone saved our field team hours every month. The UI feels premium instead of punitive.',
    name: 'Sara Ahmed',
    role: 'People Ops, Atlas Freight',
  },
]

export const DEMO_CREDENTIALS = [
  { role: 'Admin', email: 'admin@amberledger.io', password: 'password123' },
  { role: 'Manager', email: 'manager@amberledger.io', password: 'password123' },
  { role: 'Employee', email: 'employee@amberledger.io', password: 'password123' },
]

export const STATUS_COLORS = {
  draft: 'bg-secondary text-secondary-foreground',
  submitted: 'bg-warning/20 text-warning-foreground',
  approved: 'bg-success/20 text-success-foreground',
  rejected: 'bg-destructive/18 text-destructive',
  pending: 'bg-warning/20 text-warning-foreground',
}

export const BASE_COUNTRIES = [
  { name: 'India', currencyCode: 'INR', flag: '🇮🇳', cca2: 'IN' },
  { name: 'United States', currencyCode: 'USD', flag: '🇺🇸', cca2: 'US' },
  { name: 'United Kingdom', currencyCode: 'GBP', flag: '🇬🇧', cca2: 'GB' },
  { name: 'United Arab Emirates', currencyCode: 'AED', flag: '🇦🇪', cca2: 'AE' },
  { name: 'Singapore', currencyCode: 'SGD', flag: '🇸🇬', cca2: 'SG' },
  { name: 'Germany', currencyCode: 'EUR', flag: '🇩🇪', cca2: 'DE' },
  { name: 'Japan', currencyCode: 'JPY', flag: '🇯🇵', cca2: 'JP' },
]
