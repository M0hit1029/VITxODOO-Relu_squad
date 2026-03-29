/**
 * This project currently uses JSX instead of TypeScript to match the existing
 * Vite scaffold, but the app keeps shared data shapes centralized through JSDoc
 * and service helpers so it can be migrated to TS without changing behavior.
 */
export const typeShapeNotes = {
  user: ['id', 'name', 'email', 'role', 'managerId', 'status'],
  expense: ['id', 'description', 'category', 'amount', 'currency', 'status'],
  approvalRule: ['id', 'name', 'employeeId', 'mode', 'approvers'],
}
