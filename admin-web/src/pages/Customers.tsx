import { useEffect, useState } from 'react';
import { UserPlus, Edit, Trash2, Search, Users } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';

type Customer = {
  id: number;
  name: string;
  phoneNumber?: string | null;
  address?: string | null;
  notes?: string | null;
};

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', address: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
    setCurrentPage(1);
  }, [searchQuery]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const query = `?limit=1000${searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ''}`;
      const response = await apiClient.get<{ data: Customer[] }>(`/customers${query}`);
      setCustomers(response.data || []);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingCustomer(null);
    setFormData({ name: '', phoneNumber: '', address: '', notes: '' });
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phoneNumber: c.phoneNumber || '',
      address: c.address || '',
      notes: c.notes || ''
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingCustomer) {
        await apiClient.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        await apiClient.post('/customers', payload);
      }
      
      setShowModal(false);
      setCurrentPage(1);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!customerToDelete) return;
    try {
      await apiClient.delete(`/customers/${customerToDelete}`);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete customer');
    }
  }

  return (
    <div className="flex-col gap-6" style={{ position: 'relative' }}>
      <div className="card mb-6 p-4 flex gap-4 items-center">
        <div className="relative flex-1" style={{ maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div className="ml-auto">
          <button className="btn btn-primary" onClick={openCreate}>
            <UserPlus size={18} /> Add Customer
          </button>
        </div>
      </div>

      <div className="card table-container p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>PHONE</th>
              <th>ADDRESS</th>
              <th>NOTES</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-6">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8">
                  <div className="flex flex-col items-center gap-4" style={{ color: 'var(--text-muted)' }}>
                    <Users size={32} />
                    <p>{searchQuery ? 'No customers match your search.' : 'No customers yet. Add one to get started.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{c.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.phoneNumber || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.address || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.notes || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn" onClick={() => openEdit(c)} style={{ display: 'inline-flex', marginRight: '0.25rem' }}><Edit size={16} /></button>
                    <button className="icon-btn" onClick={() => setCustomerToDelete(c.id)} style={{ display: 'inline-flex', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(customers.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingCustomer ? 'Edit Customer' : 'New Customer'}
        maxWidth="400px"
      >
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NAME</label>
            <input required className="input-field" placeholder="Full name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PHONE NUMBER (OPTIONAL)</label>
            <input className="input-field" placeholder="e.g. 09123456789" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ADDRESS (OPTIONAL)</label>
            <input className="input-field" placeholder="Full address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NOTES (OPTIONAL)</label>
            <input className="input-field" placeholder="Any special instructions" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={customerToDelete !== null}
        title="Delete customer?"
        description="Are you sure you want to delete this customer? You can't undo this action."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
}
