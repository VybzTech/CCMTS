/**
 * Direct port of createDoughnutChart() from the PHP app's app.js - same
 * segment colors, legend on the bottom. Used for the
 * letters-by-directorate breakdown.
 */
import './chartSetup';
import { Doughnut } from 'react-chartjs-2';
import { useChartThemeColors } from './chartTheme';

const SEGMENT_COLORS = [
  'rgba(217, 119, 6, 0.85)',
  'rgba(22, 163, 74, 0.85)',
  'rgba(124, 58, 237, 0.85)',
  'rgba(37, 99, 235, 0.85)',
  'rgba(8, 145, 178, 0.85)',
  'rgba(220, 38, 38, 0.85)',
];

interface DoughnutChartProps {
  labels: string[];
  data: number[];
}

export function DoughnutChart({ labels, data }: DoughnutChartProps) {
  const colors = useChartThemeColors();

  return (
    <Doughnut
      data={{
        labels,
        datasets: [
          {
            data,
            backgroundColor: SEGMENT_COLORS,
            borderWidth: 2,
            borderColor: colors.segmentBorder,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.legend,
              padding: 16,
              font: { size: 12 },
            },
          },
        },
      }}
    />
  );
}
