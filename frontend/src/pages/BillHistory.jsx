import React, { useState, useEffect } from 'react';
import { Search, Trash2, Eye, Download, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { saleService } from '../services/api';
import { realTimeSyncService } from '../services/realTimeSync';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Invoice } from '../components/ui/Invoice';
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
  const [isDownloading, setIsDownloading] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, searchQuery, filterType, sortBy, startDate, endDate]);

  // Fetch all bills
  const fetchBills = async () => {
    try {
      setIsLoading(true);
      const res = await saleService.getAll({ limit: 500 }); // Assuming higher limit for history
      const data = res.data?.data || res.data || [];
      
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
      let filterStartDate = new Date();
      let filterEndDate = new Date();

      switch (filterType) {
        case 'today':
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          filterStartDate.setDate(today.getDate() - 7);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
          filterEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'year':
          filterStartDate = new Date(today.getFullYear(), 0, 1);
          filterEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          if (!startDate || !endDate) {
            result = [];
            break;
          }
          filterStartDate = new Date(startDate);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(endDate);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        default:
          break;
      }

      result = result.filter(bill => {
        const billDate = new Date(bill.date || bill.createdAt);
        return billDate >= filterStartDate && billDate <= filterEndDate;
      });
    }

    // Search by bill ID or customer name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(bill =>
        (bill._id && bill._id.toLowerCase().includes(query)) ||
        (bill.customerName && bill.customerName.toLowerCase().includes(query)) ||
        (bill.customerPhone && bill.customerPhone.includes(query))
      );
    }

    // Sort bills securely
    result.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      const amountA = Number(a.grandTotal || 0);
      const amountB = Number(b.grandTotal || 0);

      switch (sortBy) {
        case 'latest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'highest': return amountB - amountA;
        case 'lowest': return amountA - amountB;
        default: return dateB - dateA; // Fallback to latest
      }
    });

    setFilteredBills(result);
  };

  // View bill details / Download / Print (Triggers Invoice component)
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

  // Bulk Download
  const handleDownloadSelected = async () => {
    try {
      setIsDownloading(true);
      
      let params = {};
      if (filterType !== 'all') {
        const today = new Date();
        let filterStartDate = new Date();
        let filterEndDate = new Date();

        switch (filterType) {
          case 'today':
            filterStartDate.setHours(0, 0, 0, 0);
            filterEndDate.setHours(23, 59, 59, 999);
            break;
          case 'week':
            filterStartDate.setDate(today.getDate() - 7);
            filterStartDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
            filterEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
          case 'year':
            filterStartDate = new Date(today.getFullYear(), 0, 1);
            filterEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
          case 'custom':
            if (!startDate || !endDate) {
              toast.error('Please select both start and end dates');
              setIsDownloading(false);
              return;
            }
            filterStartDate = new Date(startDate);
            filterStartDate.setHours(0, 0, 0, 0);
            filterEndDate = new Date(endDate);
            filterEndDate.setHours(23, 59, 59, 999);
            break;
          default:
            break;
        }
        
        params.startDate = filterStartDate.toISOString();
        params.endDate = filterEndDate.toISOString();
      }

      toast.loading('Generating Excel file...', { id: 'download-toast' });
      const res = await saleService.downloadSales(params);
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bills.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Bills downloaded successfully', { id: 'download-toast' });
    } catch (err) {
      console.error('Download error:', err);
      if (err.response && err.response.status === 404) {
        toast.error('No bills found in the selected range', { id: 'download-toast' });
      } else {
        toast.error('Failed to download bills', { id: 'download-toast' });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate totals for display
  const totalAmount = filteredBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
  const totalItems = filteredBills.reduce((sum, bill) => sum + (bill.items?.length || 0), 0);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent flex items-center gap-3">
            <FileText className="w-8 h-8 text-green-600" />
            Bill History
          </h1>
          <p className="text-gray-600 mt-2 font-medium">View, search, print, and download generated invoices</p>
        </div>
        <button
          onClick={handleDownloadSelected}
          disabled={isDownloading || filteredBills.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Download className="w-5 h-5" />
          )}
          Download Bills
        </button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200">
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Bill ID, Customer Name or Phone..."
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
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-blue-800 font-semibold mb-1">Total Generated Bills</p>
              <p className="text-3xl font-black text-blue-900">{filteredBills.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-green-800 font-semibold mb-1">Total Sales Revenue</p>
              <p className="text-3xl font-black text-green-900">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-purple-800 font-semibold mb-1">Total Units Sold</p>
              <p className="text-3xl font-black text-purple-900">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading historical records...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg font-medium">No bills available matching filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Bill No / ID</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Customer</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase text-center">Items</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase">Date & Time</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Total Amount</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBills.map((bill, idx) => {
                    const billDateObj = new Date(bill.date || bill.createdAt);
                    const billIdDisplay = bill.billNumber || bill._id.substring(0, 8).toUpperCase();
                    return (
                      <tr
                        key={bill._id}
                        className="hover:bg-gray-50 transition-colors bg-white"
                      >
                        <td className="px-6 py-4">
                           <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                             #{billIdDisplay}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{bill.customerName || 'Walk-in'}</p>
                          {bill.customerPhone && <p className="text-xs text-gray-500 mt-1">{bill.customerPhone}</p>}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {bill.items?.length || 0}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{billDateObj.toLocaleDateString('en-IN')}</p>
                          <p className="text-xs text-gray-500">{billDateObj.toLocaleTimeString('en-IN')}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-lg text-green-700">
                            ₹{Number(bill.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewBill(bill)}
                              className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-md transition-colors flex items-center gap-1.5 font-medium text-sm"
                              title="Inspect & Print"
                            >
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button
                              onClick={() => handleViewBill(bill)}
                              className="px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 rounded-md transition-colors flex items-center gap-1.5 font-medium text-sm"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" /> DL
                            </button>
                            <button
                              onClick={() => handleDeleteClick(bill)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete bill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Bill Invoice Format */}
      {isViewModalOpen && selectedBill && (
        <Invoice 
          sale={selectedBill} 
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedBill(null);
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && billToDelete && (
        <DeleteConfirmModal
          title="Delete Bill Record"
          message={`Are you sure you want to completely erase the bill #${billToDelete.billNumber || billToDelete._id.substring(0, 8)}? This action cannot be reversed.`}
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

export default BillHistory;
