import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

export function SpendingChart({ title = 'Spending Trend', data, type = 'area' }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value, 'INR')} />
              <Bar dataKey="amount" fill="var(--primary)" radius={[12, 12, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="amberArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value, 'INR')} />
              <Area type="monotone" dataKey="amount" stroke="var(--primary)" fill="url(#amberArea)" strokeWidth={2.5} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
