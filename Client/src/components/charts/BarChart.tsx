/**
 * Direct port of createBarChart() from the PHP app's app.js - same
 * per-bar color rotation. Used for the courier-workload chart.
 */
import './chartSetup';
import { Bar } from 'react-chartjs-2';
import { useChartThemeColors } from './chartTheme';

const BAR_COLORS = [
  'rgba(22, 163, 74, 0.8)',
  'rgba(37, 99, 235, 0.8)',
  'rgba(217, 119, 6, 0.8)',
  'rgba(220, 38, 38, 0.8)',
  'rgba(124, 58, 237, 0.8)',
  'rgba(8, 145, 178, 0.8)',
  'rgba(22, 163, 74, 0.6)',
  'rgba(37, 99, 235, 0.6)',
];

interface BarChartProps {
  labels: string[];
  data: number[];
  label?: string;
}

export function BarChart({ labels, data, label = 'Count' }: BarChartProps) {
  const colors = useChartThemeColors();

  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: BAR_COLORS,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: colors.grid },
            ticks: { color: colors.tick, font: { size: 12 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: colors.tick, font: { size: 12 } },
          },
        },
      }}
    />
  );
}
