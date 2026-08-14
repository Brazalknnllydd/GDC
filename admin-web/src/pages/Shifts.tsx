import { useEffect, useState, useMemo } from 'react';
import { Clock, Users, DollarSign, AlertTriangle, X, ChevronRight, FileText } from 'lucide-react';
import { apiClient } from '../lib/api';
import { exportToPdf } from '../lib/export';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { format, formatDuration, intervalToDuration } from 'date-fns';

type ShiftSale = {
  id: number;
  receiptNumber: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
};

type Shift = {
  id: number;
  status: 'OPEN' | 'CLOSED' | 'FORCE_CLOSED';
  openingCash: string;
  closingCash: string | null;
  expectedClosingCash: string | null;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  user: { id: number; name: string; username: string };
  _count: { sales: number };
};

type ShiftReport = Shift & {
  sales: ShiftSale[];
};

const STATUS_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  OPEN: { label: 'Active', style: { backgroundColor: 'var(--success-light)', color: 'var(--success)', fontWeight: 600, borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem' } },
  CLOSED: { label: 'Closed', style: { backgroundColor: 'var(--bg-panel)', color: 'var(--text-muted)', fontWeight: 600, borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem' } },
  FORCE_CLOSED: { label: 'Force Closed', style: { backgroundColor: '#fff3cd', color: '#856404', fontWeight: 600, borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem' } },
};

function getDuration(start: string, end: string | null): string {
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const dur = intervalToDuration({ start: from, end: to });
  const parts = [];
  if (dur.hours) parts.push(`${dur.hours}h`);
  if (dur.minutes !== undefined) parts.push(`${dur.minutes}m`);
  return parts.join(' ') || '< 1m';
}

function fmt(val: string | null | undefined): string {
  if (!val) return '—';
  return `₱${Number(val).toFixed(2)}`;
}

export function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'FORCE_CLOSED'>('ALL');

  // Report modal
  const [reportShift, setReportShift] = useState<ShiftReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Force close
  const [forceCloseId, setForceCloseId] = useState<number | null>(null);
  const [forceCloseNotes, setForceCloseNotes] = useState('');
  const [showForceCloseDialog, setShowForceCloseDialog] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  async function fetchShifts() {
    try {
      setLoading(true);
      const data = await apiClient.get<Shift[]>('/shifts');
      setShifts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openReport(shiftId: number) {
    try {
      setReportLoading(true);
      const report = await apiClient.get<ShiftReport>(`/shifts/${shiftId}/report`);
      setReportShift(report);
    } catch (err) {
      console.error(err);
      alert('Failed to load shift report.');
    } finally {
      setReportLoading(false);
    }
  }

  async function handleForceClose() {
    if (!forceCloseId) return;
    try {
      await apiClient.put(`/shifts/${forceCloseId}/force-close`, { notes: forceCloseNotes || null });
      setShowForceCloseDialog(false);
      setForceCloseId(null);
      setForceCloseNotes('');
      fetchShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to force-close shift.');
    }
  }

  const filteredShifts = useMemo(() => {
    if (statusFilter === 'ALL') return shifts;
    return shifts.filter(s => s.status === statusFilter);
  }, [shifts, statusFilter]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  // Summary metrics (all time)
  const activeShifts = shifts.filter(s => s.status === 'OPEN');
  const todayShifts = shifts.filter(s => {
    const today = new Date();
    const d = new Date(s.startedAt);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const todayCash = todayShifts.reduce((sum, s) => sum + Number(s.closingCash ?? 0), 0);

  if (loading) {
    return <div className="flex justify-center p-8">Loading shifts...</div>;
  }

  const pagedShifts = filteredShifts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex-col gap-6">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <MetricCard title="Active Shifts" value={activeShifts.length} icon={Clock} color="primary" />
        <MetricCard title="Shifts Today" value={todayShifts.length} icon={Users} color="secondary" />
        <MetricCard title="Cash Collected Today" value={`₱${todayCash.toFixed(2)}`} icon={DollarSign} color="success" />
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex gap-3 items-center flex-wrap">
        <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.875rem' }}>Status:</span>
        {(['ALL', 'OPEN', 'CLOSED', 'FORCE_CLOSED'] as const).map(s => (
          <button
            key={s}
            type="button"
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'ALL' ? 'All' : s === 'OPEN' ? 'Active' : s === 'FORCE_CLOSED' ? 'Force Closed' : 'Closed'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={() => {
              const body = filteredShifts.map(s => [
                s.user.name,
                `@${s.user.username}`,
                format(new Date(s.startedAt), 'MMM dd, yyyy hh:mm a'),
                s.endedAt ? format(new Date(s.endedAt), 'MMM dd, yyyy hh:mm a') : 'Ongoing',
                getDuration(s.startedAt, s.endedAt),
                fmt(s.openingCash),
                fmt(s.expectedClosingCash),
                fmt(s.closingCash),
                s.closingCash && s.expectedClosingCash
                  ? `${(Number(s.closingCash) - Number(s.expectedClosingCash)) >= 0 ? '+' : ''}${(Number(s.closingCash) - Number(s.expectedClosingCash)).toFixed(2)}`
                  : '—',
                String(s._count.sales),
                s.status,
              ]);
              exportToPdf({
                title: 'Shifts Report',
                subtitle: `Filtered: ${statusFilter === 'ALL' ? 'All Shifts' : statusFilter}`,
                head: ['Cashier', 'Username', 'Started', 'Ended', 'Duration', 'Opening', 'Expected', 'Closing', 'Variance', 'Sales', 'Status'],
                body,
                filename: `Shifts_Report_${format(new Date(), 'yyyy-MM-dd')}`,
              });
            }}
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="card table-container p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>CASHIER</th>
              <th>STARTED</th>
              <th>ENDED</th>
              <th>DURATION</th>
              <th>OPENING CASH</th>
              <th>EXPECTED</th>
              <th>CLOSING CASH</th>
              <th>VARIANCE</th>
              <th>SALES</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {pagedShifts.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No shifts found.
                </td>
              </tr>
            ) : pagedShifts.map(shift => {
              const variance = shift.closingCash && shift.expectedClosingCash
                ? Number(shift.closingCash) - Number(shift.expectedClosingCash)
                : null;
              const badge = STATUS_BADGE[shift.status] ?? STATUS_BADGE.CLOSED;

              return (
                <tr
                  key={shift.id}
                  onClick={() => openReport(shift.id)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-panel)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    <div>{shift.user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>@{shift.user.username}</div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {format(new Date(shift.startedAt), 'MMM dd, yyyy')}<br />
                    <span style={{ fontSize: '0.75rem' }}>{format(new Date(shift.startedAt), 'hh:mm a')}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {shift.endedAt ? (
                      <>
                        {format(new Date(shift.endedAt), 'MMM dd, yyyy')}<br />
                        <span style={{ fontSize: '0.75rem' }}>{format(new Date(shift.endedAt), 'hh:mm a')}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--success)', fontWeight: 500 }}>Ongoing</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {getDuration(shift.startedAt, shift.endedAt)}
                  </td>
                  <td style={{ fontWeight: 500 }}>{fmt(shift.openingCash)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{fmt(shift.expectedClosingCash)}</td>
                  <td style={{ fontWeight: 500 }}>{fmt(shift.closingCash)}</td>
                  <td>
                    {variance === null ? (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    ) : (
                      <span style={{
                        fontWeight: 600,
                        color: variance === 0 ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {variance >= 0 ? '+' : '-'}₱{Math.abs(variance).toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>{shift._count.sales}</td>
                  <td><span style={badge.style}>{badge.label}</span></td>
                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="icon-btn"
                        title="View Report"
                        onClick={() => openReport(shift.id)}
                      >
                        <ChevronRight size={16} />
                      </button>
                      {shift.status === 'OPEN' && (
                        <button
                          type="button"
                          className="icon-btn"
                          title="Force Close"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => { setForceCloseId(shift.id); setShowForceCloseDialog(true); }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredShifts.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Shift Report Modal */}
      <Modal
        isOpen={!!reportShift}
        title={reportShift ? `Shift Report — ${reportShift.user.name}` : 'Shift Report'}
        subtitle={reportShift ? format(new Date(reportShift.startedAt), 'MMMM dd, yyyy') : undefined}
        onClose={() => setReportShift(null)}
        maxWidth="680px"
      >
        {reportShift && (() => {
          const sales = reportShift.sales ?? [];
          const cashSales = sales.filter(s => s.paymentMethod.toLowerCase() === 'cash' && s.status === 'completed');
          const gcashSales = sales.filter(s => s.paymentMethod.toLowerCase() === 'gcash');
          const utangSales = sales.filter(s => s.paymentMethod.toLowerCase() === 'utang');
          const cashTotal = cashSales.reduce((s, x) => s + Number(x.totalAmount), 0);
          const gcashTotal = gcashSales.reduce((s, x) => s + Number(x.totalAmount), 0);
          const utangTotal = utangSales.reduce((s, x) => s + Number(x.totalAmount), 0);
          const grandTotal = sales.reduce((s, x) => s + Number(x.totalAmount), 0);
          const variance = reportShift.closingCash && reportShift.expectedClosingCash
            ? Number(reportShift.closingCash) - Number(reportShift.expectedClosingCash)
            : null;
          const badge = STATUS_BADGE[reportShift.status] ?? STATUS_BADGE.CLOSED;

          return (
            <div className="p-6 flex-col gap-6">
              {/* Header Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cashier</div>
                  <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{reportShift.user.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</div>
                  <div style={{ marginTop: '0.25rem' }}><span style={badge.style}>{badge.label}</span></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Started</div>
                  <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{format(new Date(reportShift.startedAt), 'MMM dd, yyyy hh:mm a')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ended</div>
                  <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>
                    {reportShift.endedAt ? format(new Date(reportShift.endedAt), 'MMM dd, yyyy hh:mm a') : <span style={{ color: 'var(--success)' }}>Ongoing</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</div>
                  <div style={{ fontWeight: 500, marginTop: '0.25rem' }}>{getDuration(reportShift.startedAt, reportShift.endedAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Transactions</div>
                  <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{sales.length}</div>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)' }}>Cash Reconciliation</h4>
                <div className="card p-0" style={{ overflow: 'hidden' }}>
                  {[
                    { label: 'Opening Cash', value: fmt(reportShift.openingCash) },
                    { label: 'Cash Sales', value: `₱${cashTotal.toFixed(2)}` },
                    { label: 'Expected Closing Cash', value: fmt(reportShift.expectedClosingCash) },
                    { label: 'Actual Closing Cash', value: fmt(reportShift.closingCash) },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{row.label}</span>
                      <span style={{ fontWeight: 600 }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: variance === null ? 'transparent' : variance === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {variance !== null && variance !== 0 && <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />}
                      Variance
                    </span>
                    <span style={{ fontWeight: 700, color: variance === null ? 'var(--text-muted)' : variance === 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {variance === null ? '—' : `${variance >= 0 ? '+' : ''}₱${Math.abs(variance).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-main)' }}>Sales Breakdown</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {[
                    { label: 'Cash', count: cashSales.length, total: cashTotal },
                    { label: 'GCash', count: gcashSales.length, total: gcashTotal },
                    { label: 'Utang', count: utangSales.length, total: utangTotal },
                  ].map(p => (
                    <div key={p.label} className="card p-4" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{p.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>₱{p.total.toFixed(2)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.count} tx</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', marginTop: '0.75rem', fontWeight: 700, fontSize: '1rem' }}>
                  Grand Total: <span style={{ color: 'var(--primary)' }}>₱{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {reportShift.notes && (
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Notes</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.75rem', backgroundColor: 'var(--bg-panel)', borderRadius: '0.5rem' }}>
                    {reportShift.notes}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Force Close Dialog */}
      {showForceCloseDialog && (
        <Modal
          isOpen={showForceCloseDialog}
          title="Force Close Shift"
          subtitle="This will immediately close the cashier's active shift."
          onClose={() => { setShowForceCloseDialog(false); setForceCloseId(null); setForceCloseNotes(''); }}
          maxWidth="420px"
        >
          <div className="p-6 flex-col gap-4">
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '0.5rem', borderLeft: '3px solid var(--danger)', fontSize: '0.875rem', color: 'var(--danger)' }}>
              The cashier has not submitted a closing cash count. A variance will be calculated automatically.
            </div>
            <div>
              <label className="form-label">Reason / Notes (Optional)</label>
              <textarea
                className="input-field"
                rows={3}
                value={forceCloseNotes}
                onChange={e => setForceCloseNotes(e.target.value)}
                placeholder="e.g. Cashier forgot to close shift before leaving..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForceCloseDialog(false); setForceCloseId(null); }}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleForceClose}>
                Force Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
