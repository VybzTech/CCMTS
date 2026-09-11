/**
 * Registers the Chart.js pieces this app actually uses. Import this
 * once per chart component file (Chart.js's register() is idempotent,
 * so importing it from multiple files is safe) rather than globally in
 * main.tsx, so a page that never renders a chart doesn't pull in
 * Chart.js at all when Vite code-splits by route.
 */
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export { ChartJS };
