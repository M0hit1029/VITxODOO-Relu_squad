import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import * as approvalService from '@/services/approvalService'

export function useApprovals() {
  const user = useAuthStore((state) => state.user)
  const getApprovalQueue = useCallback(
    (filters) => approvalService.getApprovalQueue(user, filters),
    [user],
  )
  const decideApproval = useCallback(
    (payload) => approvalService.decideApproval({ ...payload, actor: user }),
    [user],
  )

  return {
    user,
    getApprovalQueue,
    decideApproval,
    getApprovalRules: approvalService.getApprovalRules,
    saveApprovalRule: approvalService.saveApprovalRule,
    deleteApprovalRule: approvalService.deleteApprovalRule,
  }
}
