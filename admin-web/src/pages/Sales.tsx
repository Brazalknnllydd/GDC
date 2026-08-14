import { useEffect, useState, useMemo } from 'react';
import { DollarSign, Smartphone, AlertCircle, Banknote, Calendar, FileSpreadsheet, FileText } from 'lucide-react';
import { apiClient } from '../lib/api';
import { exportToExcel, exportToPdf } from '../lib/export';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type SelectedTrendPoint = {
  label: string;
  value: number;
};

type Sale = {
  id: number;
  receiptNumber: string;
  totalAmount: string;
  paymentMethod: string;
  createdAt: string;
  customer: { name: string } | null;
  user: { name: string } | null;
  items: {
    quantity: number;
    price: string;
    subtotal: string;
    product: {
      id: number;
      name: string;
    }
  }[];
};

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedTrendPoint, setSelectedTrendPoint] = useState<SelectedTrendPoint | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Default to current month in YYYY-MM format
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    async function fetchSales() {
      try {
        const data = await apiClient.get<Sale[]>('/sales');
        setSales(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  // Filter sales by selected month
  const filteredSales = useMemo(() => {
    if (!selectedMonth) return sales;
    const [year, month] = selectedMonth.split('-').map(Number);
    const refDate = new Date(year, month - 1, 1);
    return sales.filter(s =>
      isWithinInterval(new Date(s.createdAt), {
        start: startOfMonth(refDate),
        end: endOfMonth(refDate),
      })
    );
  }, [sales, selectedMonth]);

  // Reset page when month changes
  useEffect(() => { setCurrentPage(1); }, [selectedMonth]);
  useEffect(() => { setSelectedTrendPoint(null); }, [selectedMonth]);

  // Aggregations (based on filtered month)
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const cashTotal = filteredSales
    .filter(s => s.paymentMethod.toLowerCase() === 'cash')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const gcashTotal = filteredSales
    .filter(s => s.paymentMethod.toLowerCase() === 'gcash')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const utangTotal = filteredSales
    .filter(s => s.paymentMethod.toLowerCase() === 'utang')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  // Chart Data — daily breakdown for the selected month
  const chartLabels = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) =>
      format(new Date(year, month - 1, i + 1), 'MMM dd')
    );
  }, [selectedMonth]);

  const chartValues = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = new Date(year, month - 1, i + 1);
      return filteredSales
        .filter(s => isSameDay(new Date(s.createdAt), day))
        .reduce((sum, s) => sum + Number(s.totalAmount), 0);
    });
  }, [filteredSales, selectedMonth]);

  const chartData: ChartData<'line', number[], string> = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Revenue',
        data: chartValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    onClick: (event, elements, chart) => {
      if (!elements.length) {
        setSelectedTrendPoint(null);
        chart.setActiveElements([]);
        chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
        chart.update();
        return;
      }

      const index = elements[0].index;
      const label = chartLabels[index];
      const value = chartValues[index] ?? 0;
      setSelectedTrendPoint({ label, value });

      chart.setActiveElements([{ datasetIndex: 0, index }]);
      chart.tooltip?.setActiveElements([{ datasetIndex: 0, index }], { x: event.x, y: event.y });
      chart.update();
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
      x: { grid: { display: false }, border: { display: false } }
    },
  };

  // Top Selling Products (based on filtered month)
  const topProducts = useMemo(() => {
    const map = new Map<number, { name: string; sold: number }>();
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        if (!item.product) return;
        const existing = map.get(item.product.id) || { name: item.product.name, sold: 0 };
        existing.sold += item.quantity;
        map.set(item.product.id, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [filteredSales]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading sales history...</div>;
  }

  function handleExportExcel() {
    const rows = filteredSales.map(s => ({
      'Receipt No.': s.receiptNumber,
      'Date & Time': format(new Date(s.createdAt), 'MMM dd, yyyy hh:mm a'),
      'Customer': s.customer?.name ?? 'Walk-in',
      'Payment Method': s.paymentMethod,
      'Total (₱)': Number(s.totalAmount).toFixed(2),
    }));
    exportToExcel(rows, `Sales_${selectedMonth}`, 'Sales History');
  }

  function handleExportPdf() {
    const body = filteredSales.map(s => [
      s.receiptNumber,
      format(new Date(s.createdAt), 'MMM dd, yyyy hh:mm a'),
      s.customer?.name ?? 'Walk-in',
      s.paymentMethod,
      `₱${Number(s.totalAmount).toFixed(2)}`,
    ]);
    exportToPdf({
      title: 'Sales History',
      subtitle: `Month: ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} — Total Revenue: ₱${totalRevenue.toFixed(2)}`,
      head: ['Receipt No.', 'Date & Time', 'Customer', 'Payment Method', 'Total'],
      body,
      filename: `Sales_${selectedMonth}`,
    });
  }

  return (
    <div className="flex-col gap-6">
      {/* Month Picker */}
      <div className="card p-4 flex items-center gap-4">
        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
        <label style={{ fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Filter by Month</label>
        <input
          type="month"
          className="input-field"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          style={{ maxWidth: '220px' }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSelectedMonth(format(new Date(), 'yyyy-MM'))}
          style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
        >
          This Month
        </button>
        <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportExcel}
            style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportPdf}
            style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <MetricCard
          title="Total Revenue"
          value={`₱${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="primary"
        />
        <MetricCard
          title="Cash Total"
          value={`₱${cashTotal.toFixed(2)}`}
          icon={Banknote}
          color="success"
        />
        <MetricCard
          title="GCash Total"
          value={`₱${gcashTotal.toFixed(2)}`}
          icon={Smartphone}
          color="secondary"
        />
        <MetricCard
          title="Utang Total"
          value={`₱${utangTotal.toFixed(2)}`}
          icon={AlertCircle}
          color="danger"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="card" style={{ height: '400px' }}>
          <div className="flex items-center justify-between gap-4" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Revenue Trend — {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</h3>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Tap a point to see the exact amount
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
            {selectedTrendPoint ? (
              <>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Selected day
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedTrendPoint.label}</div>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  ₱{selectedTrendPoint.value.toFixed(2)}
                </div>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                Press any point on the line to reveal the exact revenue for that day.
              </span>
            )}
          </div>
          <div style={{ height: '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Top Selling Products</h3>
          <div className="flex-col gap-4">
            {topProducts.length > 0 ? topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                    #{i + 1}
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{p.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{p.sold} sold</span>
              </div>
            )) : (
              <div className="text-muted text-center py-4">No products sold yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card table-container mt-6 p-0">
        <div className="p-6 pb-4 border-b border-border" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Transaction Log</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>RECEIPT NO.</th>
              <th>DATE & TIME</th>
              <th>CUSTOMER</th>
              <th>PAYMENT METHOD</th>
              <th style={{ textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(sale => (
              <tr 
                key={sale.id} 
                onClick={() => setSelectedSale(sale)}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-panel)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sale.receiptNumber}</td>
                <td style={{ color: 'var(--text-muted)' }}>{format(new Date(sale.createdAt), 'MMM dd, yyyy - hh:mm a')}</td>
                <td>
                  {sale.customer ? (
                    <span className="badge badge-success">{sale.customer.name}</span>
                  ) : (
                    <span className="badge badge-neutral">Walk-in</span>
                  )}
                </td>
                <td>{sale.paymentMethod}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                  ₱{Number(sale.totalAmount).toFixed(2)}
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted">No transactions found for this month.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(filteredSales.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Transaction Details"
        subtitle={selectedSale?.receiptNumber}
        maxWidth="500px"
      >
        {selectedSale && (
          <div className="p-6">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Date & Time</span>
                <span style={{ fontWeight: 500 }}>{format(new Date(selectedSale.createdAt), 'MMM dd, yyyy - hh:mm a')}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Cashier</span>
                <span style={{ fontWeight: 500 }}>{selectedSale.user ? selectedSale.user.name : 'Unknown'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Customer</span>
                <span style={{ fontWeight: 500 }}>{selectedSale.customer ? selectedSale.customer.name : 'Walk-in'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Payment Method</span>
                <span style={{ fontWeight: 500 }}>{selectedSale.paymentMethod}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Purchased</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.product?.name || 'Unknown Product'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity} x ₱{Number(item.price).toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₱{Number(item.subtotal).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6" style={{ fontSize: '1.125rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₱{Number(selectedSale.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
