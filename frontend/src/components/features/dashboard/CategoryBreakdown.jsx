import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

const colors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--destructive)', '#5b8ff9', '#36cfc9']

export function CategoryBreakdown({ data, currency = 'INR' }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value, currency)} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
