"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = Record<string, string | number>;

type BarDefinition = {
  key: string;
  name: string;
  color: string;
};

const chartColors = ["#6D4CC2", "#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#0891B2", "#9333EA"];

export function BarComparisonChart({
  data,
  xKey,
  bars,
}: {
  data: ChartDatum[];
  xKey: string;
  bars: BarDefinition[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RegistrationTrendChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="registrationCount" stroke="#6D4CC2" strokeWidth={2} name="Registrations" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PiePanel({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={96} innerRadius={48} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
