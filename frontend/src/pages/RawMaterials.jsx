import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, PackageOpen, X, Save, Loader2, FlaskConical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rawMaterialService } from '../services/api';

const UNITS = ['pieces', 'kilograms', 'grams', 'liters', 'milliliters', 'sheets', 'meters', 'centimeters', 'boxes', 'rolls', 'bags', 'tons'];

const emptyForm = { name: '', price: '', stock_quantity: '', stock_unit: 'pieces' };

export default function RawMaterials() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'stock' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [stockInput, setStockInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      const res = await rawMaterialService.getAll();
      setMaterials(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load raw materials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Open Modals ──────────────────────────────────────────────────────────
  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (mat) => { setSelected(mat); setForm({ name: mat.name, price: mat.price, stock_quantity: mat.stock_quantity, stock_unit: mat.stock_unit }); setModal('edit'); };
  const openStock = (mat) => { setSelected(mat); setStockInput(String(mat.stock_quantity)); setModal('stock'); };
  const openDelete = (mat) => { setSelected(mat); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm(emptyForm); setStockInput(''); };

  // ─── CRUD Handlers ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setIsSaving(true);
    try {
      if (modal === 'add') {
        await rawMaterialService.create({ name: form.name.trim(), price: parseFloat(form.price) || 0, stock_quantity: parseFloat(form.stock_quantity) || 0, stock_unit: form.stock_unit });
        toast.success('Raw material added!');
      } else {
        await rawMaterialService.update(selected.id, { name: form.name.trim(), price: parseFloat(form.price) || 0, stock_quantity: parseFloat(form.stock_quantity), stock_unit: form.stock_unit });
        toast.success('Raw material updated!');
      }
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStock = async () => {
    const qty = parseFloat(stockInput);
    if (isNaN(qty) || qty < 0) { toast.error('Enter a valid quantity'); return; }
    setIsSaving(true);
    try {
      await rawMaterialService.updateStock(selected.id, qty);
      toast.success('Stock updated!');
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await rawMaterialService.remove(selected.id);
      toast.success('Raw material deleted');
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">Raw Materials</h1>
          </div>
          <p className="text-gray-500 text-sm ml-13">Manage your raw material stock, prices, and units</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-none hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
        >
          <Plus className="w-5 h-5" /> Add Raw Material
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Materials</p>
          <p className="text-4xl font-extrabold text-gray-900">{materials.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Low Stock (&lt; 10)</p>
          <p className="text-4xl font-extrabold text-amber-500">{materials.filter(m => m.stock_quantity < 10).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Out of Stock</p>
          <p className="text-4xl font-extrabold text-red-500">{materials.filter(m => m.stock_quantity === 0).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No raw materials yet</p>
            <p className="text-sm">Click "Add Raw Material" to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">#</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Price (₹)</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Current Stock</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Unit</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.map((mat, idx) => (
                <tr key={mat.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 text-gray-400 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{mat.name}</td>
                  <td className="px-6 py-4 text-gray-700">₹{Number(mat.price).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                      ${mat.stock_quantity === 0 ? 'bg-red-100 text-red-700' :
                        mat.stock_quantity < 10 ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'}`}>
                      {mat.stock_quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 capitalize">{mat.stock_unit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openStock(mat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Update Stock"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Stock
                      </button>
                      <button
                        onClick={() => openEdit(mat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => openDelete(mat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ─────────────────────────────────────── */}
      {(modal === 'add' || modal === 'edit') && (
        <ModalOverlay onClose={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{modal === 'add' ? 'Add New Raw Material' : 'Edit Raw Material'}</h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Raw Material Name *">
                <input
                  type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Kraft Paper, Ink, Glue"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </Field>
              <Field label="Price per Unit (₹)">
                <input
                  type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Current Stock">
                  <input
                    type="number" min="0" step="any" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </Field>
                <Field label="Unit">
                  <select
                    value={form.stock_unit} onChange={e => setForm(f => ({ ...f, stock_unit: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {modal === 'add' ? 'Add Material' : 'Save Changes'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── UPDATE STOCK MODAL ───────────────────────────────────── */}
      {modal === 'stock' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Update Stock</h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-1">Material: <span className="font-semibold text-gray-800">{selected.name}</span></p>
            <p className="text-sm text-gray-500 mb-6">Current stock: <span className="font-semibold text-gray-800">{selected.stock_quantity} {selected.stock_unit}</span></p>
            <Field label={`New Stock Quantity (${selected.stock_unit})`}>
              <input
                type="number" min="0" step="any" value={stockInput}
                onChange={e => setStockInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                autoFocus
              />
            </Field>
            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleUpdateStock} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Update Stock
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── DELETE MODAL ─────────────────────────────────────────── */}
      {modal === 'delete' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Raw Material?</h2>
            <p className="text-gray-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{selected.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── Reusable helpers ──────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
