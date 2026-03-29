import * as Tabs from '@radix-ui/react-tabs'
import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { getCompanySettings, updateCompanySettings } from '@/services/companyService'

export default function CompanySettings() {
  const company = useAuthStore((state) => state.company)
  const setCompany = useAuthStore((state) => state.setCompany)
  const [name, setName] = useState(company?.name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [notifications, setNotifications] = useState({
    submission: true,
    approval: true,
    rejection: true,
  })
  const [minLength, setMinLength] = useState(8)
  const [requireMfa, setRequireMfa] = useState(false)

  useEffect(() => {
    setIsLoadingSettings(true)
    getCompanySettings()
      .then((settings) => {
        setCompany(settings)
        setName(settings.name)
        setNotifications(settings.notifications)
        setMinLength(settings.security.minLength)
        setRequireMfa(settings.security.requireMfa)
      })
      .catch(() => {
        setName(company?.name ?? '')
      })
      .finally(() => {
        setIsLoadingSettings(false)
      })
  }, [company?.name, setCompany])

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const updated = await updateCompanySettings({
        name,
        notifications,
        security: {
          minLength,
          requireMfa,
        },
      })
      setCompany(updated)
      toast.success('Settings saved.')
    } catch (error) {
      toast.error(error.message || 'Unable to save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-foreground">Company Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your workspace configuration</p>
        </div>
        <Button onClick={saveSettings} loading={isSaving} loadingText="Saving changes..." disabled={isLoadingSettings}>
          <Save className="mr-1.5 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs.Root defaultValue="general" className="space-y-6">
        <Tabs.List className="flex flex-wrap gap-1.5 rounded-xl bg-accent/50 p-1">
          {['general', 'notifications', 'security'].map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="rounded-lg px-4 py-2 text-sm font-medium capitalize text-muted-foreground transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="general">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Company Name</label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Company name"
                  disabled={isLoadingSettings || isSaving}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Country</label>
                  <Input value={company?.country ?? 'India'} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Base Currency</label>
                  <Input value={company?.baseCurrency ?? 'INR'} disabled className="opacity-60" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="notifications">
          <Card>
            <CardContent className="space-y-3 p-6">
              {Object.entries(notifications).map(([key, value]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <span className="text-sm font-medium capitalize text-foreground">{key} notifications</span>
                  <input
                    type="checkbox"
                    checked={value}
                    disabled={isLoadingSettings || isSaving}
                    onChange={(event) => setNotifications((current) => ({ ...current, [key]: event.target.checked }))}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                </label>
              ))}
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="security">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Minimum Password Length</label>
                <Input
                  type="number"
                  value={minLength}
                  disabled={isLoadingSettings || isSaving}
                  onChange={(event) => setMinLength(Number(event.target.value))}
                  placeholder="Minimum password length"
                  className="max-w-[200px]"
                />
              </div>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/50 px-4 py-3 transition-colors hover:bg-accent/50">
                <span className="text-sm font-medium text-foreground">Require MFA</span>
                <input
                  type="checkbox"
                  checked={requireMfa}
                  disabled={isLoadingSettings || isSaving}
                  onChange={(event) => setRequireMfa(event.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
              </label>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
