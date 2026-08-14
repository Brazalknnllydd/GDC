import { useEffect, useState } from 'react';
import { Tags, Edit, Trash2, Search, Plus } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';

interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const response = await apiClient.get<Category[]>('/categories');
      setCategories(response || []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  }

  function openEdit(c: Category) {
    setEditingCategory(c);
    setFormData({
      name: c.name,
      description: c.description || ''
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
        description: formData.description.trim() || null,
      };

      if (editingCategory) {
        await apiClient.put(`/categories/${editingCategory.id}`, payload);
      } else {
        await apiClient.post('/categories', payload);
      }
      
      setShowModal(false);
      setCurrentPage(1);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    try {
      await apiClient.delete(`/categories/${categoryToDelete}`);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category (it may be in use by products)');
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
            placeholder="Search categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div className="ml-auto">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Add Category
          </button>
        </div>
      </div>

      <div className="card table-container p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>DESCRIPTION</th>
              <th style={{ width: '100px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>Loading categories...</td>
              </tr>
            ) : (() => {
              const filteredCategories = categories.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
              );

              if (filteredCategories.length === 0) {
                return (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No categories found.
                    </td>
                  </tr>
                );
              }

              return filteredCategories
                .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                .map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 500 }}>{cat.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{cat.description || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" onClick={() => openEdit(cat)} style={{ display: 'inline-flex', marginRight: '0.25rem' }} title="Edit Category">
                        <Edit size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => setCategoryToDelete(cat.id)} style={{ display: 'inline-flex', color: 'var(--danger)' }} title="Delete Category">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ));
            })()}
          </tbody>
        </table>
        {(() => {
          const filteredCount = categories.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
          ).length;
          
          return (
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCount / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          );
        })()}
      </div>

      {showModal && (
        <Modal 
          isOpen={showModal}
          title={editingCategory ? "Edit Category" : "New Category"} 
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
            <div>
              <label className="form-label">Category Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Beverages"
                required
              />
            </div>

            <div>
              <label className="form-label">Description (Optional)</label>
              <textarea 
                className="input-field" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="e.g. Drinks and refreshments"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving || !formData.name.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone and may fail if products are currently assigned to it."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
