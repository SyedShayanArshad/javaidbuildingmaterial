'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useToast, Button } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
}

export default function StockAdjustmentPage() {
  const router = useRouter();
  const toast = useToast();

  const [pageLoading, setPageLoading] = useState(true); // products loading
  const [loading, setLoading] = useState(false); // submit loading
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
      setPageLoading(true);
      const response = await fetch('/api/products', {
        credentials: 'include',
      });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const selectedProduct = products.find(
    (p) => p.id === formData.productId
  );

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
    <>
      {(pageLoading || loading) && (
        <LoadingSpinner
          fullScreen
          size="lg"
          text={pageLoading ? 'Loading products...' : 'Adjusting stock...'}
        />
      )}

      <div>
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/products"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Products
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Stock Adjustment
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manually adjust inventory quantities
          </p>
        </div>

        {/* Card */}
        <div className="max-w-2xl">
          <div className="card">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product */}
              <div>
                <label className="label">Select Product *</label>
                <select
                  className="input"
                  required
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                >
                  <option value="">-- Select Product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Current: {product.stockQuantity}{' '}
                      {product.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock */}
              {selectedProduct && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Current Stock</h3>
                  <p className="text-2xl font-bold">
                    {selectedProduct.stockQuantity}{' '}
                    {selectedProduct.unit}
                  </p>
                </div>
              )}

              {/* Adjustment Type */}
              <div>
                <label className="label">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium ${
                      formData.adjustmentType === 'IN'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300'
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, adjustmentType: 'IN' })
                    }
                  >
                    <Plus className="w-5 h-5" />
                    Add Stock
                  </button>

                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium ${
                      formData.adjustmentType === 'OUT'
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-slate-300'
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, adjustmentType: 'OUT' })
                    }
                  >
                    <Minus className="w-5 h-5" />
                    Remove Stock
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="label">Quantity *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  className="input"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />

                {selectedProduct && formData.quantity && (
                  <p className="text-sm mt-2">
                    New stock will be:{' '}
                    <strong>
                      {formData.adjustmentType === 'IN'
                        ? (
                            selectedProduct.stockQuantity +
                            parseFloat(formData.quantity)
                          ).toFixed(3)
                        : (
                            selectedProduct.stockQuantity -
                            parseFloat(formData.quantity)
                          ).toFixed(3)}{' '}
                      {selectedProduct.unit}
                    </strong>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="label">Notes</label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!formData.productId}
                  variant="primary"
                >
                  Adjust Stock
                </Button>

                <Link href="/products">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
