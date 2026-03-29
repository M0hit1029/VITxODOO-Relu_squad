import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApprovalRuleBuilder } from '@/components/features/approvals/ApprovalRuleBuilder'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { deleteApprovalRule, getApprovalRules, saveApprovalRule } from '@/services/approvalService'
import { listUsers } from '@/services/userService'

export default function ApprovalRules() {
  const [rules, setRules] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingRuleId, setDeletingRuleId] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rulesResult, usersResult] = await Promise.all([getApprovalRules(), listUsers({})])
      setRules(rulesResult)
      setUsers(usersResult)
      setSelectedRule((current) => {
        if (!rulesResult.length) return null
        if (!current) return rulesResult[0]
        return rulesResult.find((rule) => rule.id === current.id) ?? rulesResult[0]
      })
    } catch (error) {
      toast.error(error.message || 'Unable to load approval rules.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">Approval Rules</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure approval workflows for expenses</p>
        </div>
        <Button onClick={() => setSelectedRule(null)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="space-y-3 p-5">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`cursor-pointer transition-all hover:border-primary/20 ${
                    selectedRule?.id === rule.id ? 'border-primary/30 ring-1 ring-primary/10' : ''
                  }`}
                  onClick={() => setSelectedRule(rule)}
                >
                  <CardContent className="space-y-3 p-5">
                    <div>
                      <p className="font-medium text-card-foreground">{rule.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rule.employee?.name ?? 'Unassigned'} - {rule.mode} - {rule.approvers.length} approver(s)
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedRule(rule)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        loading={deletingRuleId === rule.id}
                        loadingText="Deleting..."
                        onClick={async (event) => {
                          event.stopPropagation()
                          setDeletingRuleId(rule.id)
                          try {
                            await deleteApprovalRule(rule.id)
                            toast.success('Rule deleted.')
                            await load()
                          } finally {
                            setDeletingRuleId(null)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        <ApprovalRuleBuilder
          users={users}
          rule={selectedRule}
          onCancel={() => setSelectedRule(null)}
          onSave={async (rule) => {
            await saveApprovalRule(rule)
            toast.success('Rule saved.')
            await load()
          }}
        />
      </div>
    </div>
  )
}
