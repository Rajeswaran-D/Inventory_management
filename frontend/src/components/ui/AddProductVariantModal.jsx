import React, { useState, useEffect, useMemo } from 'react';
import { X, AlertCircle, CheckCircle, Plus, Layers, Database, Layout, Settings, Info, Tag, DollarSign, ChevronDown, Edit3, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { productService } from '../../services/api';

export const AddProductVariantModal = ({ isOpen, onClose, onProductAdded, product: initialProduct }) => {
  // --- CONFIG & OPTIONS STATE ---
  const [config, setConfig] = useState({});
  const [materials, setMaterials] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [predefinedSizes, setPredefinedSizes] = useState([]);
  const [predefinedColors, setPredefinedColors] = useState([]);
  
  // --- UI & UI LOGIC STATE ---
  const [mode, setMode] = useState(initialProduct ? 'existing' : 'existing'); // 'existing' | 'new'
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- FORM DATA ---
  const [formData, setFormData] = useState({
    productId: initialProduct?.id || initialProduct?._id || '',
    name: '',
    materialType: '',
    attributes: { size: false, gsm: false, color: false },
    // Variant fields
    sizeSelect: '',
    sizeManual: '',
    gsmSelect: '',
    gsmManual: '',
    colorSelect: '',
    colorManual: '',
    price: ''
  });

  // --- PRE-LOAD STUFF ---
  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const [configRes, materialsRes, productsRes, sizesRes, colorsRes] = await Promise.all([
        productService.getProductConfig(),
        productService.getMaterials(),
        productService.getAllProducts(),
        productService.getSizeOptions(),
        productService.getColorOptions()
      ]);

      setConfig(configRes.data || {});
      setMaterials(materialsRes.data || []);
      setAvailableProducts(productsRes.data?.data || productsRes.data || []);
      setPredefinedSizes(sizesRes.data || []);
      setPredefinedColors(colorsRes.data || []);
    } catch (err) {
      console.error('Error loading options:', err);
      toast.error('Failed to load system preferences');
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOptions();
      if (initialProduct) {
        setFormData(prev => ({
          ...prev,
          productId: initialProduct.id || initialProduct._id,
          sizeSelect: '', sizeManual: '',
          gsmSelect: '', gsmManual: '',
          colorSelect: '', colorManual: '',
          price: ''
        }));
      }
    }
  }, [isOpen, initialProduct]);

  // --- LOGIC: WHAT FIELDS TO SHOW ---
  const currentProduct = useMemo(() => {
    if (mode === 'existing') {
        return availableProducts.find(p => (p.id || p._id) === formData.productId);
    }
    return null;
  }, [mode, availableProducts, formData.productId]);

  const showSize = mode === 'existing' ? currentProduct?.hasSize : formData.attributes.size;
  const showGSM = mode === 'existing' ? currentProduct?.hasGSM : formData.attributes.gsm;
  const showColor = mode === 'existing' ? currentProduct?.hasColor : formData.attributes.color;

  // --- HANDLERS ---
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError('');
    if (newMode === 'new') {
        setFormData(prev => ({ 
            ...prev, 
            productId: '', 
            name: '', 
            materialType: '', 
            attributes: { size: false, gsm: false, color: false } 
        }));
    }
  };

  const updateAttributesByMaterial = (materialType) => {
     const rules = config[materialType];
     if (rules) {
        setFormData(prev => ({
            ...prev,
            materialType,
            attributes: {
                size: rules.hasSize,
                gsm: rules.hasGSM,
                color: rules.hasColor
            }
        }));
     } else {
        setFormData(prev => ({ ...prev, materialType }));
     }
  };

  // Helper to get final values (prioritize manual if exists)
  const getFinalValues = () => {
    return {
        size: formData.sizeManual || formData.sizeSelect,
        gsm: formData.gsmManual || formData.gsmSelect,
        color: formData.colorManual || formData.colorSelect
    };
  };

  const validate = () => {
    const final = getFinalValues();
    if (mode === 'existing' && !formData.productId) return 'Please select a product category';
    if (mode === 'new') {
        if (!formData.name) return 'Product name is required';
        // Material Type is now OPTIONAL
    }
    if (showSize && !final.size) return 'Size is required (select or type)';
    if (showGSM && !final.gsm) return 'GSM is required (select or type)';
    if (showColor && !final.color) return 'Color is required (select or type)';
    if (!formData.price || formData.price <= 0) return 'Valid price is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
        setError(err);
        toast.error(err);
        return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const final = getFinalValues();
      const payload = {
        productId: mode === 'existing' ? formData.productId : null,
        name: mode === 'new' ? formData.name : null,
        materialType: mode === 'new' ? formData.materialType : null,
        attributes: mode === 'new' ? formData.attributes : null,
        variant: {
            size: showSize ? final.size : null,
            gsm: showGSM ? parseInt(final.gsm) : null,
            color: showColor ? final.color : null
        },
        price: parseFloat(formData.price)
      };

      const res = await productService.createFullProduct(payload);
      const successMsg = res.data?.message || 'Product created successfully';
      setSuccess(successMsg);
      toast.success(successMsg);
      
      setTimeout(() => {
        onClose();
        onProductAdded?.();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save product';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl shadow-inner border border-white/30">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Expand Inventory</h2>
              <p className="text-xs text-blue-100/80 font-medium">Add categories and variants in one go</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all group active:scale-90">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30 dark:bg-gray-900/50">
          {/* Mode Selector */}
          {!initialProduct && (
            <div className="flex p-1.5 bg-gray-200/50 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-inner">
              <button
                 type="button"
                 onClick={() => handleModeChange('existing')}
                 className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${mode === 'existing' ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-md border border-gray-100 dark:border-gray-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                 <Database className="w-4 h-4" /> Existing Catalog
              </button>
              <button
                 type="button"
                 onClick={() => handleModeChange('new')}
                 className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${mode === 'new' ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-md border border-gray-100 dark:border-gray-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                 <Layers className="w-4 h-4" /> Custom Creation
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-100/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-300 font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-100/50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-2xl animate-in slide-in-from-top-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 dark:text-green-300 font-bold">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* ── SECTION 1: IDENTITY ── */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Product Identity</h3>
                </div>
              </div>

              {mode === 'existing' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase">Select Item Group</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    disabled={!!initialProduct}
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="">-- Choose from Catalog --</option>
                    {availableProducts.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id} className="dark:bg-gray-800">{p.name} ({p.materialType || 'Custom'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Kraft Office Pack"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Material Type <span className="text-gray-300 dark:text-gray-600">(Optional)</span></label>
                      <div className="group relative">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-300 cursor-help" />
                        <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                          Select a type to apply attribute rules automatically, or leave empty for custom setup.
                        </div>
                      </div>
                    </div>
                    <select
                      value={formData.materialType}
                      onChange={(e) => updateAttributesByMaterial(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    >
                      <option value="">-- Skip & Manual Setup --</option>
                      {materials.map(m => <option key={m} value={m} className="dark:bg-gray-800">{m}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION 2: ATTRIBUTE SWITCH BOARD (ONLY FOR NEW MODE) ── */}
            {mode === 'new' && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <Settings className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Property Rules</h3>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {['size', 'gsm', 'color'].map(attr => (
                    <button
                      key={attr}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, [attr]: !formData.attributes[attr] }
                      })}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border-4 transition-all duration-300 ${
                        formData.attributes[attr] 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 scale-100 shadow-lg shadow-indigo-100 dark:shadow-none' 
                          : 'border-transparent bg-gray-50 dark:bg-gray-800/50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-3xl mb-2">{attr === 'size' ? '📏' : attr === 'gsm' ? '⚖️' : '🎨'}</span>
                      <span className="text-[10px] font-black uppercase tracking-tighter">{attr} ENABLED</span>
                    </button>
                  ))}
                </div>
                {!formData.materialType && (
                    <p className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/20 p-2 rounded-lg text-center">
                        💡 Manual setup: Toggle properties that apply to this product.
                    </p>
                )}
              </div>
            )}

            {/* ── SECTION 3: HYBRID VARIANT BUILDER ── */}
            {(showSize || showGSM || showColor || (mode === 'new')) && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl border border-blue-200 dark:border-blue-900/50 p-6 shadow-xl shadow-blue-50/50 dark:shadow-none space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 border-b pb-4 border-blue-50 dark:border-blue-900/30">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Tag className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Initial Variant Builder</h3>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* SIZE BUILDER */}
                  {showSize && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">Product Size</label>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">Select or Type</span>
                      </div>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                          <select
                            value={formData.sizeSelect}
                            onChange={(e) => setFormData({ ...formData, sizeSelect: e.target.value })}
                            className="w-full pl-5 pr-10 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer"
                          >
                            <option value="">-- Choose Standard --</option>
                            {predefinedSizes.map(s => <option key={s} value={s} className="dark:bg-gray-800 font-bold">{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="flex-1 relative">
                          <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                          <input
                            type="text"
                            placeholder="Type Custom Size..."
                            value={formData.sizeManual}
                            onChange={(e) => setFormData({ ...formData, sizeManual: e.target.value })}
                            className="w-full pl-12 pr-5 py-4 bg-white dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-2xl font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GSM BUILDER */}
                  {showGSM && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">Paper GSM</label>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Hybrid Input</span>
                      </div>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                          <select
                            value={formData.gsmSelect}
                            onChange={(e) => setFormData({ ...formData, gsmSelect: e.target.value })}
                            className="w-full pl-5 pr-10 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-2xl font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer"
                          >
                            <option value="">-- Common GSM --</option>
                            {[60, 70, 80, 100, 120, 150].map(g => <option key={g} value={g} className="dark:bg-gray-800 font-bold">{g} GSM</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="number"
                            placeholder="Manual GSM..."
                            value={formData.gsmManual}
                            onChange={(e) => setFormData({ ...formData, gsmManual: e.target.value })}
                            className="w-full px-5 py-4 bg-white dark:bg-gray-800 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl font-bold text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COLOR & PRICE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {showColor && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">Product Color</label>
                            <div className="flex flex-col gap-2">
                                <select
                                    value={formData.colorSelect}
                                    onChange={(e) => setFormData({ ...formData, colorSelect: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-900 dark:text-white outline-none"
                                >
                                    <option value="">-- Default --</option>
                                    {predefinedColors.map(c => <option key={c} value={c} className="dark:bg-gray-800 font-bold">{c}</option>)}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Type Custom Color..."
                                    value={formData.colorManual}
                                    onChange={(e) => setFormData({ ...formData, colorManual: e.target.value })}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-b-2 border-indigo-500 focus:bg-indigo-50/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                />
                            </div>
                        </div>
                     )}
                     <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase">Unit List Price</label>
                        <div className="relative h-[110px] md:h-full">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-xl w-10 h-10 flex items-center justify-center font-black shadow-lg shadow-blue-500/40">
                            ₹
                          </div>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full h-full pl-20 pr-5 py-6 bg-blue-50/50 dark:bg-blue-900/10 border-4 border-white dark:border-gray-800 rounded-3xl font-black text-3xl text-gray-900 dark:text-white shadow-inner focus:ring-8 focus:ring-blue-500/5 outline-none placeholder:text-blue-200"
                          />
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row gap-4 pt-8 shrink-0 border-t-2 border-dashed border-gray-200 dark:border-gray-800">
               <button
                 type="button"
                 onClick={onClose}
                 disabled={isSubmitting}
                 className="flex-1 py-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95 border-2 border-gray-200 dark:border-gray-700"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 disabled={isSubmitting}
                 className="flex-[2] py-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-500/20 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 active:scale-[0.98] transition group overflow-hidden relative"
               >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Layout className="w-6 h-6" /> 
                      <span>Initialize & Save</span>
                    </>
                  )}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductVariantModal;
