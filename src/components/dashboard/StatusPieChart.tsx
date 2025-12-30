import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { KPIData } from '@/types';

interface StatusPieChartProps {
  data: KPIData;
}

const COLORS = {
  login: 'hsl(221, 83%, 53%)',
  rejected: 'hsl(0, 84%, 60%)',
  approved: 'hsl(158, 64%, 52%)',
  disbursed: 'hsl(172, 66%, 50%)',
  hold: 'hsl(38, 92%, 50%)',
  relook: 'hsl(280, 65%, 60%)',
  drop: 'hsl(215, 16%, 47%)',
};

const LABELS = {
  login: 'Login',
  rejected: 'Rejected',
  approved: 'Approved',
  disbursed: 'Disbursed',
  hold: 'Hold',
  relook: 'Relook',
  drop: 'Drop',
};

export default function StatusPieChart({ data }: StatusPieChartProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key as keyof typeof LABELS],
    value,
    color: COLORS[key as keyof typeof COLORS],
  }));

  return (
    <div className="bg-card rounded-xl p-6 shadow-md">
      <h3 className="text-lg font-semibold text-foreground mb-4">Loan Status Distribution</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
