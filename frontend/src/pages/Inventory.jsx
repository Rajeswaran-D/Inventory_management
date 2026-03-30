import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { envelopeService, stockService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [stockAction, setStockAction] = useState('IN');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await envelopeService.getAll({ search: searchTerm });
      setItems(res.data || []);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddStock = async () => {
    if (!quantity || quantity <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }

    try {
      const payload = {
        envelopeId: selectedItem._id,
        quantity: Number(quantity)
      };

      if (stockAction === 'IN') {
        await stockService.recordIn(payload);
      } else {
        await stockService.recordOut(payload);
      }

      toast.success(`Stock ${stockAction === 'IN' ? 'added' : 'removed'} successfully`);
      setShowAddStockModal(false);
      setQuantity('');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage product stock and track inventory levels</p>
        </div>
        <Button icon={Plus} onClick={() => { setStockAction('IN'); setShowAddStockModal(true); }}>
          Add Stock
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Search Products
          </label>
          <Input
            icon={Search}
            placeholder="Search by size, material type, or GSM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tip: Search works across size, material type, and GSM values
          </p>
        </div>
      </Card>

      {/* Stock Status Legend */}
      <div className="flex flex-wrap gap-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Low Stock (&lt;50)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Medium Stock (50-200)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Healthy Stock (&gt;200)</span>
        </div>
      </div>

      {/* Inventory Table */}

      {/* Inventory Table */}
      <Card>
        <Table
          headers={['Size', 'Material Type', 'GSM', 'Price', 'Quantity', 'Status', 'Actions']}
          loading={loading}
          emptyState="No items found"
        >
          {items.map((item) => {
            const qty = item.quantity;
            let statusColor = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
            let statusText = 'Healthy';
            let statusDot = 'bg-green-600';
            
            if (qty < 50) {
              statusColor = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950';
              statusText = 'Low Stock';
              statusDot = 'bg-red-600';
            } else if (qty >= 50 && qty <= 200) {
              statusColor = 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
              statusText = 'Medium';
              statusDot = 'bg-yellow-500';
            }

            return (
              <TableRow key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <TableCell className="font-semibold text-gray-900 dark:text-white">{item.size}</TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">{item.materialType}</TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">{item.gsm}</TableCell>
                <TableCell className="font-semibold text-gray-900 dark:text-white">₹{item.price}</TableCell>
                <TableCell>
                  <div className="font-semibold text-lg text-gray-900 dark:text-white">
                    {qty.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                    {statusText}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setStockAction('IN');
                        setShowAddStockModal(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors font-medium"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setStockAction('OUT');
                        setShowAddStockModal(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium"
                    >
                      - Remove
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      </Card>

      {/* Add Stock Modal */}
      <Modal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        title={`${stockAction === 'IN' ? 'Add' : 'Remove'} Stock`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product: <span className="font-bold">{selectedItem?.size} - {selectedItem?.materialType}</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Quantity: <span className="font-bold text-lg">{selectedItem?.quantity}</span>
            </label>
          </div>

          <Input
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Enter quantity"
          />

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              New quantity will be: <span className="font-bold">
                {selectedItem ? (stockAction === 'IN' ? selectedItem.quantity + (Number(quantity) || 0) : Math.max(0, selectedItem.quantity - (Number(quantity) || 0))) : 0}
              </span>
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setShowAddStockModal(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStock}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
