'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface StatusDistributionChartProps {
  data: StatusData[];
  loading?: boolean;
}

const COLORS = {
  created: '#3b82f6',
  'under-review': '#f59e0b',
  assigned: '#eab308',
  'en-route-to-pickup': '#8b5cf6',
  'reached-pickup': '#ec4899',
  loaded: '#06b6d4',
  'in-transit': '#6366f1',
  'reached-destination': '#10b981',
  delivered: '#22c55e',
  'pod-received': '#059669',
  closed: '#64748b',
  cancelled: '#ef4444',
};

export function StatusDistributionChart({ data, loading }: StatusDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.status.replace(/-/g, ' ').toUpperCase(),
    value: item.count,
    color: item.color || COLORS[item.status as keyof typeof COLORS] || '#64748b',
  }));

  const renderLabel = (props: { percent?: number }) => {
    const { percent } = props;
    if (!percent) return '';
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: unknown) => (
                <span className="text-sm">{value} ({(entry as { payload: { value: number } }).payload.value})</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
