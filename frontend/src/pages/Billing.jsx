import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  FileText,
  UserPlus,
  QrCode,
  Banknote,
  Receipt,
  PackageSearch,
  ShoppingCart as CartIcon,
  ShieldCheck,
  Zap,
  Tag,
  Smile
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, customerService, saleService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export const Billing = () => {
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [cart, setCart] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const searchInputRef = useRef(null);

  const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Focus Search on load/shortcut (F2)
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // Search product suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await envelopeService.getAll({ search: searchTerm });
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      toast.error('Zero stock available for this unit.');
      return;
    }
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error('Maximum available stock reached in cart.');
        return;
      }
      setCart(cart.map(item => 
        item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, envelopeId: product._id }]);
    }
    setSearchTerm('');
    setSearchResults([]);
    searchInputRef.current.focus();
    toast.success(`${product.size} locked in cart`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
  };

  const updateQuantity = (id, delta, max) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        const newQty = Math.min(max, Math.max(1, item.quantity + delta));
        if (newQty === max && delta > 0) toast.error('Stock limit reached.');
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!customer.phone || !customer.name) {
      toast.error('Register customer before finalizing.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty.');
      return;
    }

    setIsProcessing(true);
    try {
      const customerRes = await customerService.getOrCreate(customer);
      const customerId = customerRes.data._id;

      const saleData = {
        customerId,
        items: cart.map(item => ({
          envelopeId: item._id,
          size: item.size,
          materialType: item.materialType,
          gsm: item.gsm,
          color: item.color,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        })),
        grandTotal,
        date: new Date()
      };

      await saleService.create(saleData);
      toast.success('Transaction Synchronized. Invoice Generated.');
      setCart([]);
      setCustomer({ name: '', phone: '', email: '', address: '' });
      setSearchTerm('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction aborted.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 h-[calc(100vh-140px)] animate-in pb-10">
      
      {/* Left: Product Search Panel */}
      <div className="xl:col-span-8 flex flex-col gap-8 h-full">
        
        <div className="bg-white dark:bg-surface-900 rounded-4xl p-8 border border-surface-200 dark:border-surface-800 shadow-2xl shadow-indigo-500/5">
           <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-black text-surface-900 border-b-2 border-indigo-600 inline-block pb-1">Client Registration</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                       placeholder="Identification" 
                       value={customer.name} 
                       onChange={e => setCustomer({...customer, name: e.target.value})} 
                    />
                    <Input 
                       placeholder="Telecom Signal (Phone)" 
                       value={customer.phone} 
                       onChange={e => setCustomer({...customer, phone: e.target.value})} 
                    />
                 </div>
              </div>
              <div className="md:w-px bg-surface-100 dark:bg-surface-800" />
              <div className="flex items-center justify-center bg-indigo-600/5 dark:bg-indigo-600/10 rounded-3xl p-8 border-2 border-dashed border-indigo-600/20 group hover:border-indigo-600 transition-colors">
                 <div className="text-center group-hover:scale-110 transition-transform">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-indigo-500/30">
                       <Smile className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Premium Sector</p>
                 </div>
              </div>
           </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden group">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <PackageSearch className="w-5 h-5 text-indigo-600" />
                 Product Matrix
              </CardTitle>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-surface-400">
                 Shortcut: <kbd className="bg-surface-50 p-1 border rounded shadow-sm">F2</kbd> Focus Search
              </div>
           </CardHeader>
           
           <div className="px-8 pb-4 relative">
              <Input 
                 ref={searchInputRef}
                 icon={Search} 
                 className="text-2xl font-black py-8 bg-surface-50"
                 placeholder="Search dimensions, material, or color code..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />

              {searchResults.length > 0 && (
                <div className="absolute left-8 right-8 top-full mt-2 bg-white dark:bg-surface-800 rounded-4xl border-2 border-indigo-600/20 shadow-2xl z-[100] max-h-[450px] overflow-y-auto custom-scrollbar">
                   {searchResults.map((product) => (
                     <button 
                        key={product._id} 
                        onClick={() => addToCart(product)}
                        className="w-full flex items-center justify-between p-6 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 border-b border-surface-100 dark:border-surface-700 last:border-0 group text-left transition-all"
                     >
                        <div className="flex gap-6 items-center">
                           <div className="w-16 h-16 bg-surface-50 dark:bg-surface-700 rounded-3xl flex items-center justify-center text-indigo-600 font-black border border-surface-100 group-hover:bg-indigo-600 group-hover:text-white transition-all scale-100 group-hover:scale-105 group-hover:rotate-2 shadow-sm">
                              {product.size.split('x')[0]}
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-xl text-surface-900 dark:text-white leading-none mb-1">{product.size} {product.materialType}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{product.gsm} GSM Rating | {product.quantity} Units Available</span>
                           </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <span className="block font-black text-indigo-600 text-3xl">₹{product.price}</span>
                           <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                              <Zap className="w-3 h-3" />
                              Synchronize Load
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-surface-400 bg-surface-50/50 dark:bg-surface-800/20 rounded-4xl border-2 border-dashed border-surface-200 dark:border-surface-800 transition-all hover:border-indigo-600/30">
                   <div className="w-24 h-24 bg-surface-100 rounded-full flex items-center justify-center mb-6 opacity-50 border-2 border-indigo-100">
                      <CartIcon className="w-12 h-12" />
                   </div>
                   <p className="text-xl font-black uppercase tracking-tight">Cargo Hold Uninitialized</p>
                   <p className="text-xs font-bold opacity-50">Awaiting product identification via search protocol...</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {cart.map((item) => (
                     <div key={item._id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-surface-800 rounded-4xl border border-surface-200 dark:border-surface-700 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
                        
                        <div className="flex items-center gap-6 relative z-10">
                           <div className="w-20 h-20 bg-surface-50 dark:bg-surface-700 rounded-3xl flex items-center justify-center font-black text-3xl text-indigo-600 border border-surface-100 dark:border-surface-600 shadow-inner group-hover:rotate-3 transition-transform">
                              {item.size.split('x')[0]}
                           </div>
                           <div>
                              <h4 className="font-black text-2xl text-surface-900 dark:text-white tracking-tighter leading-none mb-2 group-hover:text-indigo-600 transition-colors uppercase">{item.size} {item.materialType}</h4>
                              <p className="text-indigo-600 font-black text-2xl tracking-tighter">₹{item.price.toFixed(2)}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-10 mt-6 md:mt-0 relative z-10">
                           <div className="flex items-center bg-surface-100 dark:bg-surface-700/50 rounded-3xl p-1.5 border border-surface-200 dark:border-surface-600 shadow-inner scale-100 group-hover:scale-105 transition-transform">
                              <button 
                                onClick={() => updateQuantity(item._id, -1, item.quantity)}
                                className="w-12 h-12 flex items-center justify-center text-surface-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-surface-600 rounded-2xl transition-all shadow-sm active:scale-90"
                              >
                                 <Minus className="w-6 h-6" />
                              </button>
                              <span className="w-16 text-center font-black text-3xl text-surface-900 dark:text-white tabular-nums drop-shadow-sm">{item.quantity}</span>
                              <button 
                                 onClick={() => updateQuantity(item._id, 1, 9999)}
                                 className="w-12 h-12 flex items-center justify-center text-surface-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-surface-600 rounded-2xl transition-all shadow-sm active:scale-90"
                              >
                                 <Plus className="w-6 h-6" />
                              </button>
                           </div>
                           <div className="text-right w-32 border-l-2 border-surface-100 dark:border-surface-800 pl-8">
                              <p className="text-3xl font-black text-surface-900 dark:text-white tracking-tighter">₹{(item.price * item.quantity).toFixed(2)}</p>
                              <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest">Sub-Total</p>
                           </div>
                           <button 
                              onClick={() => removeFromCart(item._id)}
                              className="p-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-3xl transition-all active:scale-90 border-2 border-transparent hover:border-rose-100 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                           >
                              <Trash2 className="w-7 h-7" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </Card>
      </div>

      {/* Right: Summary Panel */}
      <div className="xl:col-span-4 space-y-8 flex flex-col h-full">
         <div className="bg-indigo-600 p-10 rounded-4xl text-white shadow-2xl shadow-indigo-500/40 flex flex-col h-[320px] justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 blur-2xl scale-125 group-hover:scale-150 transition-transform duration-1000 rotate-12">
               <Receipt className="w-48 h-48" />
            </div>
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-px h-6 bg-white/30" />
                  <p className="text-white/70 uppercase font-black tracking-[0.2em] text-[10px]">Total Valuation Payable</p>
               </div>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black opacity-60">₹</span>
                  <h2 className="text-6xl font-black tracking-tighter tabular-nums drop-shadow-2xl">{grandTotal.toLocaleString()}</h2>
               </div>
            </div>
            <div className="flex justify-between items-end border-t border-white/10 pt-8 relative z-10">
               <div>
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Items Quota</p>
                  <p className="text-3xl font-black text-white">{cart.length}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Volume Units</p>
                  <p className="text-3xl font-black text-white">{cart.reduce((s, i) => s + i.quantity, 0)}</p>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-surface-900 p-10 rounded-4xl border-2 border-surface-200 dark:border-surface-800 shadow-2xl flex-1 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-surface-50 px-4 py-1.5 rounded-bl-3xl border-l-2 border-b-2 border-surface-200 text-[10px] font-black uppercase tracking-widest text-surface-400">POS Console v2.0</div>
            
            <div className="space-y-8 mt-4">
               <div className="space-y-4">
                  <div className="flex justify-between text-surface-500 font-black uppercase tracking-[0.1em] text-xs px-2">
                     <span>Load Subtotal</span>
                     <span className="text-surface-900 dark:text-white">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-surface-500 font-black uppercase tracking-[0.1em] text-xs px-2">
                     <span>Internal Tax (0%)</span>
                     <span className="text-surface-900 dark:text-white">₹0.00</span>
                  </div>
                  <div className="flex justify-between text-indigo-500 font-black uppercase tracking-[0.1em] text-xs px-2">
                     <span>Applied Credits</span>
                     <span>-₹0.00</span>
                  </div>
               </div>

               <div className="bg-surface-50 dark:bg-surface-800 p-6 rounded-4xl border border-surface-100 dark:border-surface-700 shadow-inner group-hover:bg-indigo-50/30 transition-colors">
                  <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                     <CreditCard className="w-3 h-3" />
                     Settlement Protocol
                  </p>
                  <div className="flex flex-col gap-3">
                     <button className="flex items-center justify-between bg-white dark:bg-surface-700 p-4 rounded-2xl border-2 border-indigo-600 text-indigo-600 font-black shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.02] active:scale-95">
                        <div className="flex items-center gap-3">
                           <Banknote className="w-5 h-5" />
                           Currency (Cash)
                        </div>
                        <ShieldCheck className="w-4 h-4" />
                     </button>
                     <button className="flex items-center justify-between bg-surface-100 dark:bg-surface-800 p-4 rounded-2xl border-2 border-transparent text-surface-400 font-black hover:border-surface-200 transition-all grayscale hover:grayscale-0">
                        <div className="flex items-center gap-3">
                           <QrCode className="w-5 h-5" />
                           UPI Vector
                        </div>
                     </button>
                  </div>
               </div>
            </div>

            <div className="pt-10">
               <button 
                  onClick={handleCheckout}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-surface-200 disabled:pointer-events-none text-white py-10 rounded-[2.5rem] flex items-center justify-center gap-4 font-black text-3xl transition-all shadow-2xl shadow-indigo-500/40 active:scale-95 group/btn overflow-hidden relative"
               >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                  {isProcessing ? (
                    <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Tag className="w-8 h-8 group-hover/btn:rotate-12 transition-transform" />
                      AUTHORIZE SALE
                    </>
                  )}
               </button>
               <p className="text-center text-[8px] font-black uppercase tracking-widest text-surface-400 mt-6 opacity-30">Secure Transaction Encryption V2.1 Active</p>
            </div>
         </div>
      </div>
    </div>
  );
};
