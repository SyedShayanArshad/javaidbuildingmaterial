'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useToast, Button } from '@/components/ui';

interface Vendor {
  id: string;
  name: string;
  balance: number;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
}

interface PurchaseItem {
  productId: string;
  quantity: string;
  rate: string;
  amount: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    vendorId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    paidAmount: '',
    paymentMode: 'CASH',
    notes: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([
    { productId: '', quantity: '', rate: '', amount: 0 },
  ]);

  useEffect(() => {
    fetchVendors();
    fetchProducts();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors', { credentials: 'include' });
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
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

  const addItem = () => {
    setItems([...items, { productId: '', quantity: '', rate: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
    const newItems = [...items];
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
  const paidAmount = parseFloat(formData.paidAmount) || 0;
  const dueAmount = totalAmount - paidAmount;
  const selectedVendor = vendors.find(v => v.id === formData.vendorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate items
    const validItems = items.filter(item => item.productId && item.quantity && item.rate);
    if (validItems.length === 0) {
      setError('Please add at least one item with product, quantity, and rate');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          items: validItems.map(item => ({
            productId: item.productId,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create purchase');
      }

      toast.success('Purchase created successfully!');
      router.push('/purchases');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/purchases"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Purchases
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">New Purchase</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Create a new purchase order</p>
      </div>

      <div className="card">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="vendorId" className="label">
                Vendor *
              </label>
              <select
                id="vendorId"
                required
                className="input"
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              >
                <option value="">-- Select Vendor --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} (Balance: Rs. {vendor.balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
              {selectedVendor && (
                <div className="mt-2 p-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Previous Balance: </span>
                  <span className={selectedVendor.balance > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                    Rs. {selectedVendor.balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="purchaseDate" className="label">
                Purchase Date *
              </label>
              <input
                id="purchaseDate"
                type="date"
                required
                className="input"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Purchase Items</h2>
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
                              {product.name} ({product.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="label text-sm">Quantity *</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          required
                          className="input"
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                        {product && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{product.unit}</p>
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
              <label htmlFor="paidAmount" className="label">
                Paid Amount
              </label>
              <input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                max={totalAmount}
                className="input"
                placeholder="0.00"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
              />
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
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Rs. {paidAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Due Amount</p>
                <p className={`text-2xl font-bold ${dueAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  Rs. {dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {selectedVendor && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">New Balance</p>
                  <p className={`text-2xl font-bold ${(selectedVendor.balance + dueAmount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                    Rs. {(selectedVendor.balance + dueAmount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !formData.vendorId || items.length === 0}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Purchase'}
            </button>
            <Link href="/purchases" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
