import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/components/features/auth/AuthGuard'
import { RoleGuard } from '@/components/features/auth/RoleGuard'

const Landing = lazy(() => import('@/pages/public/Landing'))
const SignIn = lazy(() => import('@/pages/public/SignIn'))
const SignUp = lazy(() => import('@/pages/public/SignUp'))
const ForgotPassword = lazy(() => import('@/pages/public/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/public/ResetPassword'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'))
const ApprovalRules = lazy(() => import('@/pages/admin/ApprovalRules'))
const CompanySettings = lazy(() => import('@/pages/admin/CompanySettings'))
const AllExpenses = lazy(() => import('@/pages/admin/AllExpenses'))
const EmployeeDashboard = lazy(() => import('@/pages/employee/EmployeeDashboard'))
const MyExpenses = lazy(() => import('@/pages/employee/MyExpenses'))
const NewExpense = lazy(() => import('@/pages/employee/NewExpense'))
const ExpenseDetail = lazy(() => import('@/pages/employee/ExpenseDetail'))
const ManagerDashboard = lazy(() => import('@/pages/manager/ManagerDashboard'))
const ApprovalQueue = lazy(() => import('@/pages/manager/ApprovalQueue'))
const ApprovalDetail = lazy(() => import('@/pages/manager/ApprovalDetail'))
const NotFound = lazy(() => import('@/pages/shared/NotFound'))
const Unauthorized = lazy(() => import('@/pages/shared/Unauthorized'))

function RouteLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <div className="space-y-4">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <div>
          <p className="font-display text-2xl text-foreground">Loading workspace</p>
          <p className="text-sm text-muted-foreground">
            Pulling dashboards, approvals, and expense flows into place.
          </p>
        </div>
      </div>
    </div>
  )
}

function withSuspense(element) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/', element: withSuspense(<Landing />) },
  { path: '/signin', element: withSuspense(<SignIn />) },
  { path: '/signup', element: withSuspense(<SignUp />) },
  { path: '/forgot-password', element: withSuspense(<ForgotPassword />) },
  { path: '/reset-password', element: withSuspense(<ResetPassword />) },
  {
    element: withSuspense(
      <AuthGuard>
        <AppShell />
      </AuthGuard>,
    ),
    children: [
      {
        path: '/admin',
        element: withSuspense(
          <RoleGuard allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleGuard>,
        ),
      },
      {
        path: '/admin/users',
        element: withSuspense(
          <RoleGuard allowedRoles={['admin']}>
            <UserManagement />
          </RoleGuard>,
        ),
      },
      {
        path: '/admin/rules',
        element: withSuspense(
          <RoleGuard allowedRoles={['admin']}>
            <ApprovalRules />
          </RoleGuard>,
        ),
      },
      {
        path: '/admin/expenses',
        element: withSuspense(
          <RoleGuard allowedRoles={['admin']}>
            <AllExpenses />
          </RoleGuard>,
        ),
      },
      {
        path: '/admin/settings',
        element: withSuspense(
          <RoleGuard allowedRoles={['admin']}>
            <CompanySettings />
          </RoleGuard>,
        ),
      },
      { path: '/dashboard', element: withSuspense(<EmployeeDashboard />) },
      { path: '/expenses', element: withSuspense(<MyExpenses />) },
      { path: '/expenses/new', element: withSuspense(<NewExpense />) },
      { path: '/expenses/:id', element: withSuspense(<ExpenseDetail />) },
      {
        path: '/approvals',
        element: withSuspense(
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ApprovalQueue />
          </RoleGuard>,
        ),
      },
      {
        path: '/approvals/:id',
        element: withSuspense(
          <RoleGuard allowedRoles={['manager', 'admin']}>
            <ApprovalDetail />
          </RoleGuard>,
        ),
      },
      {
        path: '/manager/dashboard',
        element: withSuspense(
          <RoleGuard allowedRoles={['manager']}>
            <ManagerDashboard />
          </RoleGuard>,
        ),
      },
    ],
  },
  { path: '/403', element: withSuspense(<Unauthorized />) },
  { path: '*', element: withSuspense(<NotFound />) },
])
