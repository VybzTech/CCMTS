/**
 * Direct port of createLineChart() from the PHP app's app.js - same
 * green fill/line, same tension/point styling. Used for the delivery
 * trend chart on dashboards.
 */
import './chartSetup';
import { Line } from 'react-chartjs-2';
import { useChartThemeColors } from './chartTheme';

interface LineChartProps {
  labels: string[];
  data: number[];
  label?: string;
}

export function LineChart({ labels, data, label = 'Deliveries' }: LineChartProps) {
  const colors = useChartThemeColors();

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label,
            data,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.08)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#16a34a',
            pointRadius: 3,
            pointHoverRadius: 5,
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
            grid: { color: colors.grid },
            ticks: { color: colors.tick, font: { size: 12 } },
          },
        },
      }}
    />
  );
}
