import React, { useState, useEffect } from 'react';
import { Search, Trash2, Eye, Download, Filter, X, ArrowUpDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService } from '../services/api';
import { realTimeSyncService } from '../services/realTimeSync';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ViewBillModal } from '../components/ui/ViewBillModal';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';

export const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch bills on component mount
  useEffect(() => {
    fetchBills();

    // Subscribe to real-time updates
    const handleNewSale = () => {
      setTimeout(() => fetchBills(), 500);
    };

    const unsubscribe = realTimeSyncService.on('sale', handleNewSale);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Apply filters and search
  useEffect(() => {
    applyFiltersAndSearch();
  }, [bills, searchQuery, filterType, sortBy, startDate, endDate]);

  // Fetch all bills
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const res = await saleService.getAll({ limit: 200 });
      const data = res.data?.data || res.data || [];
      
      // Ensure we have arrays
      const billsArray = Array.isArray(data) ? data : [];
      setBills(billsArray);
    } catch (err) {
      console.error('Error fetching bills:', err);
      toast.error('Failed to load bill history');
      setBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply all filters and search
  const applyFiltersAndSearch = () => {
    let result = [...bills];

    // Filter by date range
    if (filterType !== 'all') {
      const today = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (filterType) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(today.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          if (!startDate || !endDate) {
            result = [];
            break;
          }
          startDate = new Date(startDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(endDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          break;
      }

      result = result.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= startDate && billDate <= endDate;
      });
    }

    // Search by bill ID or customer name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(bill =>
        bill._id.toLowerCase().includes(query) ||
        (bill.customerName && bill.customerName.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'highest':
        result.sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0));
        break;
      case 'lowest':
        result.sort((a, b) => (a.grandTotal || 0) - (b.grandTotal || 0));
        break;
      default:
        break;
    }

    setFilteredBills(result);
  };

  // View bill details
  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setIsViewModalOpen(true);
  };

  // Delete bill
  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;

    try {
      await saleService.delete(billToDelete._id);
      toast.success('Bill deleted successfully');
      await fetchBills();
      setIsDeleteModalOpen(false);
      setBillToDelete(null);
    } catch (err) {
      console.error('Error deleting bill:', err);
      toast.error('Failed to delete bill');
    }
  };

  // Download bill as PDF/print
  const handleDownloadBill = async (bill) => {
    try {
      // Generate invoice content
      const invoiceContent = generateInvoiceHTML(bill);
      
      // Open in new window for printing
      const newWindow = window.open('', '_blank');
      newWindow.document.write(invoiceContent);
      newWindow.document.close();
      newWindow.print();
      
      toast.success('Bill ready for download/print');
    } catch (err) {
      console.error('Error generating bill:', err);
      toast.error('Failed to generate bill');
    }
  };

  // Generate invoice HTML
  const generateInvoiceHTML = (bill) => {
    const billDate = new Date(bill.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const billTime = new Date(bill.date).toLocaleTimeString('en-IN');

    const itemsHTML = (bill.items || [])
      .map(
        (item, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.displayName || item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.price).toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${Number(item.itemTotal || item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    return `
    <html>
      <head>
        <title>Bill - ${bill._id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .bill-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-section { }
          .info-label { font-weight: bold; color: #333; }
          .info-value { color: #666; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; }
          .total-section { text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          .total-row { font-size: 16px; font-weight: bold; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📄 INVOICE</h1>
          <p>Bill ID: <strong>${bill._id}</strong></p>
        </div>

        <div class="bill-info">
          <div class="info-section">
            <div class="info-label">Customer Name:</div>
            <div class="info-value">${bill.customerName || 'N/A'}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Phone:</div>
            <div class="info-value">${bill.customerPhone || 'N/A'}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Date:</div>
            <div class="info-value">${billDate}</div>
          </div>
          <div class="info-section">
            <div class="info-label">Time:</div>
            <div class="info-value">${billTime}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 50%;">Product</th>
              <th style="width: 15%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Price</th>
              <th style="width: 15%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">Total Items: ${bill.items?.length || 0}</div>
          <div class="total-row" style="font-size: 20px; color: #27ae60;">
            Grand Total: ₹${Number(bill.grandTotal || 0).toFixed(2)}
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </body>
    </html>
    `;
  };

  // Calculate totals for display
  const totalAmount = filteredBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
  const totalItems = filteredBills.reduce((sum, bill) => sum + (bill.items?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            📋 Bill History
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View, search, and manage all billing records</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Bill ID or Customer Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter and Sort Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Date</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Amount</option>
                  <option value="lowest">Lowest Amount</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {filterType === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10">
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Bills</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredBills.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/10">
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{totalAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10">
          <CardContent>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading bills...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No bills found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Bill ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date & Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Customer</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Items</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill, idx) => (
                    <tr
                      key={bill._id}
                      className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        idx === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                        {bill._id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(bill.date).toLocaleDateString('en-IN')} <br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(bill.date).toLocaleTimeString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {bill.customerName || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
                        {bill.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                        ₹{Number(bill.grandTotal || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewBill(bill)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadBill(bill)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition"
                            title="Download/Print"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(bill)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {isViewModalOpen && selectedBill && (
        <ViewBillModal
          bill={selectedBill}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedBill(null);
          }}
        />
      )}

      {isDeleteModalOpen && billToDelete && (
        <DeleteConfirmModal
          title="Delete Bill"
          message={`Are you sure you want to delete bill ${billToDelete._id.substring(0, 8)}... from ${billToDelete.customerName || 'N/A'}?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setBillToDelete(null);
          }}
        />
      )}
    </div>
  );
};
