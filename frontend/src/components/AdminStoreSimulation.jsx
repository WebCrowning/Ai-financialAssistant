import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, RefreshCw, Search, Image as ImageIcon } from 'lucide-react';

const COLORS = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  success: '#059669',
  danger: '#dc2626',
  gray100: '#e5e7eb',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
};

const categories = ['Laptops', 'Phones', 'Wearables', 'Audio', 'Accessories'];

export default function AdminStoreSimulation({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const emptyForm = {
    name: '',
    description: '',
    price: '',
    category: 'Laptops',
    image_url: '',
    stock: 100
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p => {
      return (
        (p.name || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/store-products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load products');
      setProducts(data);
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSuccess('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price === '' ? undefined : Number(form.price),
      category: form.category,
      image_url: form.image_url.trim(),
      stock: form.stock === '' ? undefined : Number(form.stock)
    };

    if (!payload.name) return setError('Product name is required');
    if (payload.price === undefined || Number.isNaN(payload.price) || payload.price < 0) return setError('Price must be a non-negative number');
    if (!payload.category) return setError('Category is required');
    if (!payload.image_url) return setError('image_url is required');
    if (payload.stock === undefined || Number.isNaN(payload.stock) || payload.stock < 0) return setError('Stock must be a non-negative integer');

    try {
      setSubmitting(true);
      const url = editingId ? `/api/admin/store-products/${editingId}` : '/api/admin/store-products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.message || 'Request failed');

      setSuccess(editingId ? 'Product updated successfully' : 'Product created successfully');
      resetForm();
      await fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price ?? ''),
      category: p.category || 'Laptops',
      image_url: p.image_url || '',
      stock: p.stock ?? 100
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this store product? This cannot be undone.')) return;
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/store-products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Delete failed');
      setSuccess('Product deleted');
      await fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 28, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: COLORS.gray900 }}>Simulation Store - Admin CRUD</h1>
          <p style={{ margin: '6px 0 0 0', color: COLORS.gray500, fontSize: 13 }}>Manage products used by the e-commerce simulation (URL/image + price + stock).</p>
        </div>

        <button onClick={fetchProducts} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.gray200}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, background: 'rgba(220,38,38,0.08)', border: `1px solid rgba(220,38,38,0.25)`, color: COLORS.danger, padding: '12px 16px', borderRadius: 10 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: 16, background: 'rgba(5,150,105,0.08)', border: `1px solid rgba(5,150,105,0.25)`, color: COLORS.success, padding: '12px 16px', borderRadius: 10 }}>
          {success}
        </div>
      )}

      {/* Form */}
      <div style={{ marginTop: 22, background: 'white', border: `1px solid ${COLORS.gray200}`, borderRadius: 16, padding: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: COLORS.gray900 }}>
          {editingId ? `Edit Product #${editingId}` : 'Create New Product'}
        </h2>

        <form onSubmit={submit} style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, color: COLORS.gray700, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" style={inputStyle} placeholder="e.g. iPad Pro 12.9" />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, color: COLORS.gray700, fontWeight: 700, fontSize: 12, textTransform: 'uppercase' }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input" style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }} placeholder="Short product description" />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Price (CFA)</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Stock</label>
            <input type="number" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Product image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={inputStyle} placeholder="https://..." />
            {form.image_url ? (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLORS.gray200}` }}>
                  <img src={form.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.currentTarget.style.display='none';}} />
                </div>
                <div style={{ color: COLORS.gray500, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ImageIcon size={14} /> Preview shown if URL loads
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', marginTop: 6 }}>
            {editingId ? (
              <button type="button" onClick={resetForm} style={btnSecondary} disabled={submitting}>Cancel edit</button>
            ) : null}
            <button type="submit" style={btnPrimary} disabled={submitting}>
              <Plus size={16} /> {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div style={{ marginTop: 22, background: 'white', border: `1px solid ${COLORS.gray200}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: COLORS.gray900 }}>Products ({filtered.length})</h2>
          <div style={{ position: 'relative', minWidth: 280, flex: '1 1 280px', maxWidth: 420 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.gray500 }} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name/description/category..."
              style={{
                ...inputStyle,
                paddingLeft: 36,
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${COLORS.gray200}` }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 20, color: COLORS.gray500, textAlign: 'center' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 20, color: COLORS.gray500, textAlign: 'center' }}>No products found</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.gray200}` }}>
                    <td style={tdStyle}>{p.id}</td>
                    <td style={tdStyle}>
                      <div style={{ width: 56, height: 40, borderRadius: 10, overflow: 'hidden', border: `1px solid ${COLORS.gray200}`, background: '#f8fafc' }}>
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.currentTarget.style.display='none';}} />
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 800, color: COLORS.gray900 }}>{p.name}</div>
                      {p.description ? <div style={{ fontSize: 12, color: COLORS.gray500, maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div> : null}
                    </td>
                    <td style={tdStyle}>{p.category}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 900, color: COLORS.primary }}>CFA {Number(p.price).toLocaleString('en-US')}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 800, color: p.stock > 0 ? COLORS.gray900 : COLORS.danger }}>{p.stock}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" onClick={() => startEdit(p)} style={btnIconSecondary}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => remove(p.id)} style={btnIconDanger}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${COLORS.gray200}`,
  background: '#f8fafc',
  outline: 'none',
  fontSize: 14,
  color: COLORS.gray900,
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  color: COLORS.gray700,
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase'
};

const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  color: COLORS.gray500,
  fontSize: 12,
  textTransform: 'uppercase',
  fontWeight: 800,
  borderBottom: `1px solid ${COLORS.gray200}`
};

const tdStyle = {
  padding: '12px 12px',
  color: COLORS.gray700,
  fontSize: 13,
  verticalAlign: 'top'
};

const btnPrimary = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
  color: 'white',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  justifyContent: 'center'
};

const btnSecondary = {
  padding: '10px 16px',
  borderRadius: 12,
  border: `1px solid ${COLORS.gray200}`,
  background: 'white',
  color: COLORS.gray700,
  fontWeight: 800,
  cursor: 'pointer'
};

const btnIconSecondary = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: `1px solid ${COLORS.gray200}`,
  background: COLORS.gray100,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: COLORS.gray700,
  fontWeight: 900
};

const btnIconDanger = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: `1px solid rgba(220,38,38,0.3)`,
  background: 'rgba(220,38,38,0.08)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: COLORS.danger,
  fontWeight: 900
};

