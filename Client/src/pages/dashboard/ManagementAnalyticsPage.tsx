/**
 * Port of the PHP app's pages/management/analytics.php - a longer-range
 * trend view + directorate ranking, distinct from the Overview
 * dashboard's snapshot stats.
 */
import { useMemo } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { ChartCard } from '../../components/charts/ChartCard';
import { LineChart } from '../../components/charts/LineChart';
import { DataTable } from '../../components/ui/DataTable';
import { useAsyncData } from '../../hooks/useAsyncData';
import { fetchLetters } from '../../services/letterService';
import { EMPTY_LETTERS, computeDeliveryTrend, computeDirectoratePerformance } from '../../utils/letterStats';

const LARGE_PAGE_SIZE = 1000;
const TREND_DAYS = 30;

export function ManagementAnalyticsPage() {
  const { data, isLoading, error } = useAsyncData(() => fetchLetters({ limit: LARGE_PAGE_SIZE }), []);

  const letters = data?.letters ?? EMPTY_LETTERS;
  const trend = useMemo(() => computeDeliveryTrend(letters, TREND_DAYS), [letters]);
  const ranking = useMemo(
    () => [...computeDirectoratePerformance(letters)].sort((a, b) => b.deliveryRate - a.deliveryRate),
    [letters]
  );

  return (
    <AppShell pageTitle="Analytics">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Analytics</h1>
            <p>30-day delivery trend and directorate performance ranking.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <ChartCard title="30-Day Delivery Trend" fullWidth isEmpty={trend.data.every((n) => n === 0)}>
              <LineChart labels={trend.labels} data={trend.data} />
            </ChartCard>

            <Card>
              <CardHeader title="Directorate Ranking" />
              <CardBody>
                <DataTable
                  rows={ranking}
                  keyExtractor={(row) => row.id}
                  columns={[
                    { key: 'rank', header: '#', render: (_row) => ranking.indexOf(_row) + 1 },
                    { key: 'name', header: 'Directorate', render: (row) => `${row.name} (${row.code})` },
                    { key: 'total', header: 'Total Letters', render: (row) => row.total },
                    {
                      key: 'rate',
                      header: 'Delivery Rate',
                      render: (row) => (
                        <span className={`delivery-rate ${row.deliveryRate >= 80 ? 'good' : 'warning'}`}>
                          {row.deliveryRate}%
                        </span>
                      ),
                    },
                  ]}
                />
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
