import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ApprovalRuleBuilder } from '@/components/features/approvals/ApprovalRuleBuilder'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { getApprovalRules, saveApprovalRule, deleteApprovalRule } from '@/services/approvalService'
import { listUsers } from '@/services/userService'

export default function ApprovalRules() {
  const [rules, setRules] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)

  const load = useCallback(async () => {
    const [rulesResult, usersResult] = await Promise.all([getApprovalRules(), listUsers({})])
    setRules(rulesResult)
    setUsers(usersResult)
    if (!selectedRule && rulesResult[0]) setSelectedRule(rulesResult[0])
  }, [selectedRule])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      {/* Page header */}
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
          {rules.map((rule) => (
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
                  {rule.employee?.name} • {rule.mode} • {rule.approvers.length} approver(s)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedRule(rule)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await deleteApprovalRule(rule.id)
                      toast.success('Rule deleted.')
                      load()
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
            load()
          }}
        />
      </div>
    </div>
  )
}
