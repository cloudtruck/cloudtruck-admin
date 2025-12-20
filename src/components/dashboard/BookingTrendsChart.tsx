'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendData {
  date: string;
  bookings: number;
  delivered: number;
}

interface BookingTrendsChartProps {
  data: TrendData[];
  loading?: boolean;
}

export function BookingTrendsChart({ data, loading }: BookingTrendsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
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
          <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="bookings" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Total Bookings"
              dot={{ fill: '#3b82f6' }}
            />
            <Line 
              type="monotone" 
              dataKey="delivered" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Delivered"
              dot={{ fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
