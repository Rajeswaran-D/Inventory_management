import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  MoreVertical,
  MinusCircle,
  PlusCircle,
  Shapes,
  Maximize2,
  Settings2,
  Box
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, stockService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';

export const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [stockFormData, setStockFormData] = useState({ quantity: 0, type: 'IN' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await envelopeService.getAll({ 
        search: searchTerm, 
        materialType: selectedType 
      });
      setItems(res.data);
    } catch (err) {
      toast.error('Inventory failure. Contact Administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedType]);

  const handleStockAction = (item, type) => {
    setCurrentProduct(item);
    setStockFormData({ quantity: 0, type });
    setShowStockModal(true);
  };

  const submitStock = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        envelopeId: currentProduct._id, 
        quantity: Number(stockFormData.quantity) 
      };
      if (stockFormData.type === 'IN') await stockService.recordIn(payload);
      else await stockService.recordOut(payload);
      
      toast.success('Inventory state adjusted successfully.');
      setShowStockModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation aborted.');
    }
  };

  return (
    <div className="space-y-10 animate-in">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-surface-900 p-10 rounded-4xl border border-surface-200 dark:border-surface-800 shadow-2xl shadow-indigo-500/5">
        <div className="flex gap-6 items-center">
           <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 rotate-3 transition-transform hover:rotate-0 duration-500">
              <Box className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-4xl font-black tracking-tighter text-surface-900 dark:text-white leading-none mb-2">Central Repository</h1>
              <p className="text-surface-500 dark:text-surface-400 font-bold uppercase tracking-widest text-[10px]">Real-Time Logistics Control Unit</p>
           </div>
        </div>
        <Button 
          icon={Plus} 
          size="lg" 
          onClick={() => { setShowAddModal(true); setCurrentProduct(null); }}
          className="shadow-2xl translate-y-[-2px] hover:translate-y-[-4px]"
        >
          Inject New Unit
        </Button>
      </header>

      {/* Control Panel (Search/Filters) */}
      <Card className="flex flex-col md:flex-row gap-6 p-6 border-dashed bg-surface-50/50 dark:bg-surface-800/20">
         <div className="flex-1">
            <Input 
               icon={Search} 
               placeholder="Identify unit by code or dimension..." 
               value={searchTerm} 
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="md:w-64 flex items-center gap-4">
            <div className="relative w-full group">
               <Shapes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
               <select 
                  className="w-full pl-12 pr-6 py-4 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
               >
                 <option value="">Global Filter</option>
                 <option value="Cloth">Cloth Grade</option>
                 <option value="Maplitho">Maplitho Grade</option>
                 <option value="Buff">Buff Grade</option>
                 <option value="Kraft">Kraft Grade</option>
                 <option value="Vibothi">Vibothi Grade</option>
               </select>
            </div>
         </div>
      </Card>

      {/* Master Data Table */}
      <Table 
         headers={['Unit Identification', 'Logistics Specifications', 'Financial Value', 'Current Load', 'Control Actions']} 
         loading={loading}
         emptyState="Zero units found in selected sectors."
      >
        {items.map((item) => (
          <TableRow key={item._id}>
            <TableCell>
              <div className="flex flex-col">
                 <span className="text-xl font-black tracking-tight">{item.size}</span>
                 <span className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest">{item.materialType} Sector</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col font-bold">
                 <span className="text-surface-700 dark:text-surface-300">{item.gsm} GSM Rating</span>
                 <span className="text-surface-400 text-xs italic">{item.color || 'Standard Spectrum'}</span>
              </div>
            </TableCell>
            <TableCell>
               <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl inline-block border border-indigo-100 dark:border-indigo-800">
                  <span className="text-lg font-black text-indigo-600">₹{item.price.toFixed(2)}</span>
               </div>
            </TableCell>
            <TableCell>
               <div className="flex flex-col gap-1.5 w-32">
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
                     <span className={item.quantity < 1000 ? 'text-rose-500' : 'text-emerald-500'}>Status</span>
                     <span className="text-surface-400">{item.quantity.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                     <div 
                        className={cn("h-full transition-all duration-1000", item.quantity < 1000 ? 'bg-rose-500' : 'bg-indigo-600')}
                        style={{ width: `${Math.min(100, (item.quantity / 5000) * 100)}%` }}
                     />
                  </div>
               </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <button 
                   onClick={() => handleStockAction(item, 'IN')}
                   className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-90"
                   title="Adjust IN"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
                <button 
                   onClick={() => handleStockAction(item, 'OUT')}
                   className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-rose-500/20 active:scale-90"
                   title="Adjust OUT"
                >
                  <MinusCircle className="w-5 h-5" />
                </button>
                <Button variant="ghost" className="p-3" icon={Settings2}></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {/* Add Modal */}
      <Modal 
         isOpen={showAddModal} 
         onClose={() => setShowAddModal(false)}
         title="Unit Injection Protocol"
      >
         <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            try {
              await envelopeService.create(data);
              toast.success('Unit synchronized successfully.');
              setShowAddModal(false);
              fetchItems();
            } catch (err) {
              toast.error('System validation failed.');
            }
         }}>
           <Input label="Spatial Code (Size)" name="size" required placeholder="e.g. 12x15" icon={Maximize2} />
           <div className="space-y-2">
              <label className="text-sm font-bold text-surface-500 uppercase tracking-widest px-1">Material Classification</label>
              <select name="materialType" required className="w-full p-4 bg-surface-50 dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 font-bold focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none">
                <option value="Cloth">Cloth</option>
                <option value="Maplitho">Maplitho</option>
                <option value="Buff">Buff</option>
                <option value="Kraft">Kraft</option>
                <option value="Vibothi">Vibothi</option>
              </select>
           </div>
           <Input label="Density Rating (GSM)" name="gsm" type="number" placeholder="100" />
           <Input label="Financial Valuation (INR)" name="price" type="number" step="0.01" required placeholder="5.25" />
           <div className="md:col-span-2">
              <Input label="Spectral Property (Color)" name="color" placeholder="Reflective White..." />
           </div>
           <div className="md:col-span-2 flex gap-4 pt-8">
             <Button type="submit" size="lg" className="flex-1">Deploy New Unit</Button>
             <Button type="button" size="lg" variant="secondary" onClick={() => setShowAddModal(false)}>Abort Protocol</Button>
           </div>
         </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal 
         isOpen={showStockModal} 
         onClose={() => setShowStockModal(false)}
         title={`Adjusting Logistics (${stockFormData.type})`}
      >
         <div className="mb-10 text-center">
            <h4 className="text-3xl font-black text-surface-900 border-b-4 border-indigo-600 inline-block pb-2 mb-2">{currentProduct?.size}</h4>
            <p className="text-surface-400 font-black tracking-widest text-xs uppercase">{currentProduct?.materialType} SECTOR | ACTIVE LOCK</p>
         </div>
         <form onSubmit={submitStock} className="space-y-8">
           <Input 
              label="Volume Adjustment Quota" 
              type="number" 
              required
              autoFocus
              className="text-3xl font-black py-8 text-center"
              value={stockFormData.quantity}
              onChange={e => setStockFormData({...stockFormData, quantity: e.target.value})}
           />
           <div className="flex flex-col gap-4">
              <Button 
                 type="submit" 
                 size="lg"
                 className={stockFormData.type === 'IN' ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-rose-600 shadow-rose-500/30'}
              >
                 Authorize {stockFormData.type} Load
              </Button>
              <Button variant="secondary" onClick={() => setShowStockModal(false)}>Negative Authorization</Button>
           </div>
         </form>
      </Modal>
    </div>
  );
};
