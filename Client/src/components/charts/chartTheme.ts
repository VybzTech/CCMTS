/**
 * Direct port of getChartThemeColors() from the PHP app's app.js. Chart
 * canvases can't read CSS custom properties, so grid/tick/legend colors
 * have to be resolved to literal values in JS and passed into the
 * chart config - same constraint the PHP app had, same fix.
 */
import { useTheme } from '../../hooks/useTheme';

export interface ChartThemeColors {
  grid: string;
  tick: string;
  legend: string;
  segmentBorder: string;
}

export function useChartThemeColors(): ChartThemeColors {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    grid: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
    tick: isDark ? '#8b98ab' : '#94a3b8',
    legend: isDark ? '#cbd5e1' : '#475569',
    segmentBorder: isDark ? '#1e293b' : '#ffffff',
  };
}
