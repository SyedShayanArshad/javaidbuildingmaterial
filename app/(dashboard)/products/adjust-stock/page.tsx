'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, TrendingDown, History, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/useToast';
import {
  Card,
  Button,
  Select,
  Input,
  TextArea,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageHeader,
  Alert,
  Badge,
  FormGroup
} from '@/components/ui';

interface Product {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
}

interface StockAdjustment {
  id: string;
  product: { name: string; unit: string };
  movementType: string;
  quantity: number;
  notes: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function StockAdjustmentPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    adjustmentType: 'IN' as 'IN' | 'OUT',
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      await Promise.all([fetchProducts(), fetchAdjustments(), fetchSettings()]);
      setPageLoading(false);
    };
    loadData();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { 
        credentials: 'include' 
      });
      
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchAdjustments = async () => {
    try {
      const response = await fetch('/api/stock-adjustment', { 
        credentials: 'include' 
      });
      
      if (!response.ok) throw new Error('Failed to fetch adjustments');
      
      const data = await response.json();
      setAdjustments(data);
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllowNegativeStock(data.allowNegativeStock || false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const selectedProduct = products.find(
    (p) => p.id === formData.productId
  );

  const calculateNewStock = () => {
    if (!selectedProduct || !formData.quantity) return null;
    
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty)) return null;
    
    return formData.adjustmentType === 'IN'
      ? selectedProduct.stockQuantity + qty
      : selectedProduct.stockQuantity - qty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.productId) {
      setError('Please select a product');
      toast.warning('Please select a product');
      return;
    }

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      toast.warning('Please enter a valid quantity');
      return;
    }

    if (formData.adjustmentType === 'OUT' && selectedProduct) {
      if (qty > selectedProduct.stockQuantity && !allowNegativeStock) {
        const errorMsg = `Cannot remove ${qty} ${selectedProduct.unit}. Only ${selectedProduct.stockQuantity} ${selectedProduct.unit} available.`;
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

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

      // Success toast with detailed message
      const successMsg = formData.adjustmentType === 'IN' 
        ? `✓ Added ${qty} ${selectedProduct?.unit} to ${selectedProduct?.name}`
        : `✓ Removed ${qty} ${selectedProduct?.unit} from ${selectedProduct?.name}`;
      
      toast.success(successMsg);
      
      // Reset form
      setFormData({
        productId: '',
        adjustmentType: 'IN',
        quantity: '',
        notes: '',
      });

      // Refresh data
      await Promise.all([fetchProducts(), fetchAdjustments()]);

    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const newStock = calculateNewStock();

  return (
    <>
      {(pageLoading || loading) && (
        <LoadingSpinner
          fullScreen
          size="lg"
          text={pageLoading ? 'Loading stock data...' : 'Adjusting stock...'}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/products"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-2 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Products
            </Link>
            <PageHeader
              title="Stock Adjustment"
              description="Manually adjust inventory levels for opening stock, damages, corrections, or other reasons"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adjustment Form */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Adjust Stock
            </h2>

            {error && (
              <div className="mb-6">
                <Alert variant="danger" onClose={() => setError('')}>
                  {error}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <FormGroup>
                <Select
                  id="product"
                  label="Select Product"
                  required
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  options={[
                    { value: '', label: 'Choose a product...' },
                    ...products.map((product) => ({
                      value: product.id,
                      label: `${product.name} - Current: ${product.stockQuantity} ${product.unit}`,
                    })),
                  ]}
                />
              </FormGroup>

              {/* Current Stock Display */}
              {selectedProduct && (
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Current Stock
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedProduct.stockQuantity} {selectedProduct.unit}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Adjustment Type */}
              <FormGroup>
                <label className="label">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                      formData.adjustmentType === 'IN'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, adjustmentType: 'IN' })
                    }
                  >
                    <TrendingUp className="w-5 h-5" />
                    Stock In (+)
                  </button>

                  <button
                    type="button"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                      formData.adjustmentType === 'OUT'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, adjustmentType: 'OUT' })
                    }
                  >
                    <TrendingDown className="w-5 h-5" />
                    Stock Out (-)
                  </button>
                </div>
              </FormGroup>

              {/* Quantity */}
              <FormGroup>
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  min="0.001"
                  label="Quantity"
                  required
                  placeholder="0.000"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                />
                
                {newStock !== null && (
                  <p className={`text-sm mt-2 font-medium ${
                    newStock < 0 
                      ? (allowNegativeStock ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    New stock will be:{' '}
                    <strong>
                      {newStock.toFixed(3)} {selectedProduct?.unit}
                    </strong>
                    {newStock < 0 && allowNegativeStock && (
                      <span className="block text-xs mt-1">⚠️ Stock will go negative (allowed by settings)</span>
                    )}
                    {newStock < 0 && !allowNegativeStock && (
                      <span className="block text-xs mt-1">❌ Insufficient stock</span>
                    )}
                  </p>
                )}
              </FormGroup>

              {/* Notes */}
              <FormGroup>
                <TextArea
                  id="notes"
                  label="Notes / Reason"
                  rows={3}
                  placeholder="e.g., Opening stock, Damage, Theft, Correction, etc."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </FormGroup>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading || !formData.productId}
                  className="flex-1"
                  variant="primary"
                >
                  {loading ? (
                    'Adjusting...'
                  ) : formData.adjustmentType === 'IN' ? (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Add to Stock
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      Remove from Stock
                    </>
                  )}
                </Button>

                <Link href="/products">
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </Card>

          {/* Current Stock Levels */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Current Stock Levels
            </h2>
            <div 
              className="space-y-3 max-h-[600px] overflow-y-auto pr-2" 
              style={{ scrollbarWidth: 'thin' }}
            >
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No products found
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                      formData.productId === product.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                    onClick={() => setFormData({ ...formData, productId: product.id })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {product.stockQuantity}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        In Stock
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Adjustments History */}
        {adjustments.length > 0 && (
          <Card padding="none">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Adjustments
                </h2>
              </div>
              <Badge>{adjustments.length}</Badge>
            </div>
            <Table scrollable>
              <TableHeader sticky>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead>Notes</TableHead>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      <div>
                        <p className="font-medium">
                          {new Date(adj.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs">
                          {new Date(adj.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{adj.product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {adj.product.unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {adj.movementType === 'ADJUSTMENT_IN' ? (
                        <Badge variant="success">
                          <TrendingUp className="w-3 h-3" />
                          Stock In
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <TrendingDown className="w-3 h-3" />
                          Stock Out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        adj.movementType === 'ADJUSTMENT_IN'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {adj.movementType === 'ADJUSTMENT_IN' ? '+' : '-'}
                      {adj.quantity}
                    </TableCell>
                    <TableCell className="text-right text-gray-600 dark:text-gray-400">
                      {adj.balanceBefore.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {adj.balanceAfter.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {adj.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}

