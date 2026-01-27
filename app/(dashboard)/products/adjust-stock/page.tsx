'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useToast, Button } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
}

export default function StockAdjustmentPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    adjustmentType: 'IN',
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { credentials: 'include' });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/stock-adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      toast.success('Stock adjusted successfully!');
      router.push('/products');
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
          href="/products"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Adjustment</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manually adjust inventory quantities</p>
      </div>

      <div className="max-w-2xl">
        <div className="card">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="productId" className="label">
                Select Product *
              </label>
              <select
                id="productId"
                required
                className="input"
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
              >
                <option value="">-- Select Product --</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Current: {product.stockQuantity} {product.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 dark:text-white mb-2">Current Stock</h3>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                  {selectedProduct.stockQuantity} {selectedProduct.unit}
                </p>
              </div>
            )}

            <div>
              <label className="label">Adjustment Type *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.adjustmentType === 'IN'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                  onClick={() => setFormData({ ...formData, adjustmentType: 'IN' })}
                >
                  <Plus className="w-5 h-5" />
                  Add Stock (IN)
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                    formData.adjustmentType === 'OUT'
                      ? 'border-rose-600 dark:border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                  onClick={() => setFormData({ ...formData, adjustmentType: 'OUT' })}
                >
                  <Minus className="w-5 h-5" />
                  Remove Stock (OUT)
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="quantity" className="label">
                Quantity *
              </label>
              <input
                id="quantity"
                type="number"
                step="0.001"
                min="0.001"
                required
                className="input"
                placeholder="0.000"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
              {selectedProduct && formData.quantity && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  New stock will be:{' '}
                  <span className="font-semibold">
                    {formData.adjustmentType === 'IN'
                      ? (parseFloat(selectedProduct.stockQuantity.toString()) + parseFloat(formData.quantity)).toFixed(3)
                      : (parseFloat(selectedProduct.stockQuantity.toString()) - parseFloat(formData.quantity)).toFixed(3)
                    }{' '}
                    {selectedProduct.unit}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="label">
                Notes / Reason
              </label>
              <textarea
                id="notes"
                rows={3}
                className="input"
                placeholder="e.g., Damaged stock, Physical count adjustment, etc."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="font-medium text-amber-900 dark:text-amber-300 mb-2">⚠️ Important</h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Stock adjustments should only be used for corrections, damaged goods, or physical inventory counts.
                For normal transactions, use Purchase and Sales modules.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                loading={loading}
                disabled={!formData.productId}
                variant="primary"
              >
                {loading ? 'Adjusting...' : 'Adjust Stock'}
              </Button>
              <Link href="/products">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
