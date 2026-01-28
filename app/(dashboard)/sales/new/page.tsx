'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Search, X } from 'lucide-react';
import { useToast, Button } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';


interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  sellingPrice?: number;
}

interface SaleItem {
  productId: string;
  quantity: string;
  rate: string;
  amount: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');

  
  // Customer search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    isWalkIn: false,
    walkInCustomerName: '',
    saleDate: new Date().toISOString().split('T')[0],
    receivedAmount: '',
    paymentMode: 'CASH',
    notes: '',
  });

  const [items, setItems] = useState<SaleItem[]>([
    { productId: '', quantity: '', rate: '', amount: 0 },
  ]);

  useEffect(() => {
  const loadData = async () => {
    setPageLoading(true);
    await Promise.all([fetchCustomers(), fetchProducts()]);
    setPageLoading(false);
  };

  loadData();

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSearchResults(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  useEffect(() => {
  if (
    searchQuery.trim().length > 0 &&
    !formData.isWalkIn &&
    !formData.customerId   // 👈 IMPORTANT
  ) {
    setIsSearching(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomers(searchQuery);
    }, 300);
  } else {
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
  }

  return () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };
}, [searchQuery, formData.isWalkIn, formData.customerId]);


  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', { credentials: 'include' });
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { credentials: 'include' });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const searchCustomers = async (query: string) => {
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`, { 
        credentials: 'include' 
      });
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching customers:', error);
      setIsSearching(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setFormData({ ...formData, customerId: customer.id });
    setSearchQuery(`${customer.name}${customer.phone ? ` - ${customer.phone}` : ''}`);
    setShowSearchResults(false);
  };

  const clearCustomerSelection = () => {
    setFormData({ ...formData, customerId: '' });
    setSearchQuery('');
    setSearchResults([]);
  };

  const toggleWalkIn = (isWalkIn: boolean) => {
    setFormData({ 
      ...formData, 
      isWalkIn, 
      customerId: '', 
      walkInCustomerName: '',
      receivedAmount: isWalkIn ? '' : formData.receivedAmount,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const addItem = () => {
    setItems([...items, { productId: '', quantity: '', rate: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SaleItem, value: string) => {
    const newItems = [...items];
    
    // Do not auto-fill rate from product; keep rate editable by user
    
    newItems[index] = { ...newItems[index], [field]: value };

    // Calculate amount
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = qty * rate;
    }

    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const receivedAmount = parseFloat(formData.receivedAmount) || 0;
  const dueAmount = totalAmount - receivedAmount;
  const selectedCustomer = formData.customerId ? customers.find(c => c.id === formData.customerId) : null;

  // Auto-fill received amount for walk-in customers
  useEffect(() => {
    if (formData.isWalkIn && totalAmount > 0) {
      setFormData(prev => ({ ...prev, receivedAmount: totalAmount.toString() }));
    }
  }, [formData.isWalkIn, totalAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate customer selection
    if (!formData.isWalkIn && !formData.customerId) {
      setError('Please select a customer or choose walk-in customer option');
      setLoading(false);
      return;
    }

    if (formData.isWalkIn && !formData.walkInCustomerName.trim()) {
      setError('Please enter walk-in customer name');
      setLoading(false);
      return;
    }

    // Validate walk-in payment
    if (formData.isWalkIn && dueAmount !== 0) {
      setError('Walk-in customers must pay the full amount');
      setLoading(false);
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.productId && item.quantity && item.rate);
    if (validItems.length === 0) {
      setError('Please add at least one item with product, quantity, and rate');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: formData.isWalkIn ? null : formData.customerId,
          isWalkIn: formData.isWalkIn,
          walkInCustomerName: formData.isWalkIn ? formData.walkInCustomerName : null,
          saleDate: formData.saleDate,
          receivedAmount: formData.receivedAmount,
          paymentMode: formData.paymentMode,
          notes: formData.notes,
          items: validItems.map(item => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create sale');
      }

      toast.success('Sale created successfully!');
      router.push('/sales');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
  {(pageLoading || loading) && (
    <LoadingSpinner
      fullScreen
      size="lg"
      text={pageLoading ? 'Loading data...' : 'Creating sale...'}
    />
  )}

    <div>
      <div className="mb-6">
        <Link
          href="/sales"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sales
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">New Sale</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Create a new sales invoice</p>
      </div>

      <div className="card">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => toggleWalkIn(false)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    !formData.isWalkIn
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  Registered Customer
                </button>
                <button
                  type="button"
                  onClick={() => toggleWalkIn(true)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.isWalkIn
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  Walk-in Customer
                </button>
              </div>

              {!formData.isWalkIn ? (
                <div ref={searchRef} className="relative">
                  <label htmlFor="customerSearch" className="label">
                    Search Customer (by name or phone) *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      id="customerSearch"
                      type="text"
                      className="input pl-10 pr-10"
                      placeholder="Type customer name or phone number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={!!formData.customerId}
                      required={!formData.isWalkIn}
                    />
                    {formData.customerId && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      </div>
                    )}
                  </div>

                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                        >
                          <div className="font-medium text-slate-900 dark:text-white">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-slate-600 dark:text-slate-400">{customer.phone}</div>
                          )}
                          <div className={`text-sm ${customer.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            Balance: Rs. {customer.balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showSearchResults && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 text-center text-slate-600 dark:text-slate-400">
                      No customers found
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="mt-2 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded text-sm">
                      <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">{selectedCustomer.name}</div>
                      {selectedCustomer.phone && (
                        <div className="text-slate-600 dark:text-slate-400 mb-1">Phone: {selectedCustomer.phone}</div>
                      )}
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Previous Balance: </span>
                        <span className={selectedCustomer.balance > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                          Rs. {selectedCustomer.balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="walkInCustomerName" className="label">
                    Walk-in Customer Name *
                  </label>
                  <input
                    id="walkInCustomerName"
                    type="text"
                    className="input"
                    placeholder="Enter customer name..."
                    value={formData.walkInCustomerName}
                    onChange={(e) => setFormData({ ...formData, walkInCustomerName: e.target.value })}
                    required={formData.isWalkIn}
                  />
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Walk-in customers must pay the full amount. No balance is allowed.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="saleDate" className="label">
                Sale Date *
              </label>
              <input
                id="saleDate"
                type="date"
                required
                className="input"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sale Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <label className="label text-sm">Product *</label>
                        <select
                          required
                          className="input"
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Stock: {product.stockQuantity} {product.unit})
                            </option>
                          ))}
                        </select>
                        {product && product.stockQuantity <= 0 && (
                          <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">Out of stock!</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="label text-sm">Quantity *</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          max={product?.stockQuantity || 999999}
                          required
                          className="input"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                        {product && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Available: {product.stockQuantity} {product.unit}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="label text-sm">Rate *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          className="input"
                          placeholder="0.00"
                          value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label text-sm">Amount</label>
                        <input
                          type="text"
                          className="input bg-slate-100 dark:bg-slate-900"
                          value={`Rs. ${item.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                          disabled
                        />
                      </div>

                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 disabled:opacity-30 disabled:cursor-not-allowed p-2 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="receivedAmount" className="label">
                Received Amount {formData.isWalkIn && '*'}
              </label>
              <input
                id="receivedAmount"
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                className={`input ${formData.isWalkIn ? 'bg-slate-100 dark:bg-slate-900' : ''}`}
                placeholder="0.00"
                value={formData.receivedAmount}
                onChange={(e) => setFormData({ ...formData, receivedAmount: e.target.value })}
                readOnly={formData.isWalkIn}
                required={formData.isWalkIn}
              />
              {formData.isWalkIn && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Walk-in customers must pay full amount
                </p>
              )}
            </div>

            <div>
              <label htmlFor="paymentMode" className="label">
                Payment Mode
              </label>
              <select
                id="paymentMode"
                className="input"
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="BANK">Bank Transfer</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="label">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="input"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs. {totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Received Amount</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Rs. {receivedAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Due Amount</p>
                <p className={`text-2xl font-bold ${dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  Rs. {dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {selectedCustomer && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">New Balance</p>
                  <p className={`text-2xl font-bold ${(selectedCustomer.balance + dueAmount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    Rs. {(selectedCustomer.balance + dueAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || (!formData.isWalkIn && !formData.customerId) || (formData.isWalkIn && !formData.walkInCustomerName) || items.length === 0}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Sale'}
            </button>
            <Link href="/sales" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
