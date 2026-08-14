import { useEffect, useState } from 'react';
import { PackagePlus, Edit, Trash2, Upload, Search, Filter, Tags } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    categoryId: '',
    price: '',
    costPrice: '',
    stock: '',
    unit: 'pcs',
    weight: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        apiClient.get<any[]>('/products'),
        apiClient.get<any[]>('/categories')
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingProduct(null);
    setFormData({ name: '', barcode: '', categoryId: categories[0]?.id?.toString() || '', price: '', costPrice: '', stock: '', unit: 'pcs', weight: '', description: '' });
    setImageFile(null);
    setPreviewUrl('');
    setShowModal(true);
  }

  function openEdit(p: any) {
    setEditingProduct(p);
    setFormData({
      name: p.name || '',
      barcode: p.barcode || '',
      categoryId: p.categoryId?.toString() || '',
      price: p.price?.toString() || '',
      costPrice: p.costPrice?.toString() || '',
      stock: p.stock?.toString() || '',
      unit: p.unit || 'pcs',
      weight: p.weight?.toString() || '',
      description: p.description || ''
    });
    setImageFile(null);
    setPreviewUrl(p.imageUrl || '');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price || !formData.costPrice || !formData.stock) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setIsSaving(true);
      
      const form = new FormData();
      form.append('name', formData.name);
      form.append('categoryId', formData.categoryId);
      form.append('price', formData.price);
      form.append('costPrice', formData.costPrice);
      form.append('stock', formData.stock);
      form.append('unit', formData.unit);
      if (formData.barcode) form.append('barcode', formData.barcode);
      if (formData.weight) form.append('weight', formData.weight);
      if (formData.description) form.append('description', formData.description);
      
      if (imageFile) {
        form.append('image', imageFile);
      }

      const token = localStorage.getItem('token');
      const url = editingProduct ? `http://localhost:5000/products/${editingProduct.id}` : 'http://localhost:5000/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` }, // Note: NO Content-Type so browser sets boundaries automatically
        body: form
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save product');
      }

      setShowModal(false);
      setCurrentPage(1);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving product');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    try {
      await apiClient.delete(`/products/${productToDelete}`);
      setProductToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product');
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  return (
    <div className="flex-col gap-6">
      <div className="card mb-6 p-4 flex gap-4 items-center">
        <div className="relative flex-1" style={{ maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by product name or barcode..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div className="relative" style={{ minWidth: '200px' }}>
          <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <select 
            className="input-field"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/categories" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tags size={18} /> Categories
          </Link>
          <button className="btn btn-primary" onClick={openCreate}>
            <PackagePlus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="card table-container p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STOCK</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-6 text-muted">Loading products...</td></tr>
            ) : (() => {
              const filteredProducts = products.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesCategory = selectedCategory ? p.categoryId === Number(selectedCategory) : true;
                return matchesSearch && matchesCategory;
              });

              if (filteredProducts.length === 0) {
                return <tr><td colSpan={5} className="text-center p-6 text-muted">No products found.</td></tr>;
              }

              return (
                <>
                  {filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(product => (
                    <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-4">
                      {product.imageUrl ? (
                        <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>IMG</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{product.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.barcode || 'No barcode'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{product.category?.name || 'Uncategorized'}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>₱{Number(product.price).toFixed(2)}</td>
                  <td>
                    <span style={{ 
                      color: product.stock <= 10 ? 'var(--danger)' : 'var(--text-main)',
                      fontWeight: product.stock <= 10 ? 600 : 400
                    }}>
                      {product.stock} {product.unit !== 'pcs' ? product.unit : ''}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn" onClick={() => openEdit(product)} style={{ display: 'inline-flex', marginRight: '0.25rem' }}><Edit size={16} /></button>
                    <button className="icon-btn" onClick={() => setProductToDelete(product.id)} style={{ display: 'inline-flex', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </td>
                  </tr>
                  ))}
                </>
              );
            })()}
          </tbody>
        </table>
        
        {(() => {
          const filteredCount = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory ? p.categoryId === Number(selectedCategory) : true;
            return matchesSearch && matchesCategory;
          }).length;
          
          return (
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCount / ITEMS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          );
        })()}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        maxWidth="600px"
      >
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          {/* Image Upload Area */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', borderRadius: '12px', border: '2px dashed var(--border)', backgroundColor: 'var(--bg-panel)', position: 'relative', overflow: 'hidden' }}>
              {previewUrl ? (
                <img src={previewUrl.startsWith('blob:') ? previewUrl : `http://localhost:5000${previewUrl}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Upload Image</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>PRODUCT NAME *</label>
              <input required className="input-field" placeholder="E.g. Coca-Cola" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CATEGORY *</label>
              <select required className="input-field" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                <option value="" disabled>Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SELLING PRICE (₱) *</label>
              <input required type="number" step="0.01" className="input-field" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>COST PRICE (₱) *</label>
              <input required type="number" step="0.01" className="input-field" placeholder="0.00" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>INITIAL STOCK *</label>
              <input required type="number" step="0.01" className="input-field" placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>UNIT (pcs, kg, etc.)</label>
              <input className="input-field" placeholder="pcs" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BARCODE</label>
              <input className="input-field" placeholder="Optional" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>WEIGHT</label>
              <input type="number" step="0.01" className="input-field" placeholder="Optional" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DESCRIPTION</label>
            <textarea className="input-field" placeholder="Optional" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="flex justify-end gap-2 mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={productToDelete !== null}
        title="Delete product?"
        description="Are you sure you want to delete this product? You can't undo this action."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
