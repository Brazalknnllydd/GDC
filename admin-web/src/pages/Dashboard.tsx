import { useEffect, useMemo, useState } from 'react';
import { Package, Users, ReceiptText, AlertTriangle } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { apiClient } from '../lib/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type SelectedRevenuePoint = {
  label: string;
  value: number;
};

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedRevenuePoint, setSelectedRevenuePoint] = useState<SelectedRevenuePoint | null>(null);
  const [data, setData] = useState({
    products: 0,
    categories: 0,
    salesCount: 0,
    salesTotal: 0,
    lowStock: 0,
    sales: [] as any[],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [products, categories, sales] = await Promise.all([
          apiClient.get<any[]>('/products'),
          apiClient.get<any[]>('/categories'),
          apiClient.get<any[]>('/sales'),
        ]);

        const today = new Date();
        const todaySales = sales.filter(s => isSameDay(new Date(s.createdAt), today));
        const salesTotal = todaySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
        const lowStock = products.filter(p => p.stock <= 10).length;

        setData({
          products: products.length,
          categories: categories.length,
          salesCount: todaySales.length,
          salesTotal,
          lowStock,
          sales,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const weeklyRevenue = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      const daySales = data.sales.filter(s => isSameDay(new Date(s.createdAt), day));
      return {
        label: format(day, 'EEE d'),
        value: daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
      };
    });
  }, [data.sales]);

  const chartData: ChartData<'bar', number[], string> = {
    labels: weeklyRevenue.map(item => item.label),
    datasets: [
      {
        label: 'Revenue',
        data: weeklyRevenue.map(item => item.value),
        backgroundColor: '#4338ca',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    onClick: (event, elements, chart) => {
      if (!elements.length) {
        setSelectedRevenuePoint(null);
        chart.setActiveElements([]);
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chart.update();
        return;
      }

      const index = elements[0].index;
      const point = weeklyRevenue[index];
      setSelectedRevenuePoint(point ? { label: point.label, value: point.value } : null);

      chart.setActiveElements([{ datasetIndex: 0, index }]);
      chart.tooltip?.setActiveElements([{ datasetIndex: 0, index }], { x: event.x, y: event.y });
      chart.update();
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false } }
    },
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center h-full">Loading dashboard data...</div>;
  }

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <MetricCard
          title="Today's Revenue"
          value={`₱${data.salesTotal.toFixed(2)}`}
          subtitle={`${data.salesCount} transactions`}
          icon={ReceiptText}
          color="primary"
        />
        <MetricCard
          title="Total Products"
          value={data.products}
          subtitle={`${data.categories} categories active`}
          icon={Package}
          color="secondary"
        />
        <MetricCard
          title="Total Customers"
          value="--"
          subtitle="Coming soon"
          icon={Users}
          color="success"
        />
        <MetricCard
          title="Low Stock Items"
          value={data.lowStock}
          subtitle="Needs attention"
          icon={AlertTriangle}
          color={data.lowStock > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="card mt-4" style={{ height: '400px' }}>
        <div className="flex items-center justify-between gap-4" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Weekly Revenue Overview</h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Tap a bar to see the exact amount
          </span>
        </div>
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.875rem 1rem',
            borderRadius: '0.875rem',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'center',
            minHeight: '56px',
          }}
        >
          {selectedRevenuePoint ? (
            <>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Selected day
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedRevenuePoint.label}</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                ₱{selectedRevenuePoint.value.toFixed(2)}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              Press any bar to reveal the exact revenue for that day.
            </span>
          )}
        </div>
        <div style={{ height: '300px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
