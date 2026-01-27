'use client';

import { useEffect, useState } from 'react';
import { Package, TrendingUp, TrendingDown, History } from 'lucide-react';
import {
  Card,
  Button,
  Select,
  Input,
  TextArea,
  Radio,
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
  adjustmentType: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
}

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchAdjustments();
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

  const fetchAdjustments = async () => {
    try {
      const response = await fetch('/api/stock-adjustment', { credentials: 'include' });
      const data = await response.json();
      setAdjustments(data.slice(0, 20));
    } catch (error) {
      console.error('Error fetching adjustments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          productId: selectedProduct,
          adjustmentType,
          quantity: parseFloat(quantity),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust stock');
      }

      setSuccess('Stock adjusted successfully!');
      setSelectedProduct('');
      setQuantity('');
      setNotes('');
      fetchProducts();
      fetchAdjustments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Adjustment"
        description="Manually adjust inventory levels for opening stock, damages, or corrections"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustment Form */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Adjust Stock</h2>

          {error && <div className="mb-6"><Alert variant="danger" onClose={() => setError('')}>{error}</Alert></div>}
          {success && <div className="mb-6"><Alert variant="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <FormGroup>
              <Select
                id="product"
                label="Select Product"
                required
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                options={[
                  { value: '', label: 'Choose a product...' },
                  ...products.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${product.unit}) - Current: ${product.stockQuantity}`,
                  })),
                ]}
              />
            </FormGroup>

            <FormGroup>
              <label className="label">Adjustment Type *</label>
              <div className="flex gap-6 mt-2">
                <Radio
                  id="stock-in"
                  name="adjustmentType"
                  value="IN"
                  checked={adjustmentType === 'IN'}
                  onChange={() => setAdjustmentType('IN')}
                  label="Stock In (+)"
                />
                <Radio
                  id="stock-out"
                  name="adjustmentType"
                  value="OUT"
                  checked={adjustmentType === 'OUT'}
                  onChange={() => setAdjustmentType('OUT')}
                  label="Stock Out (-)"
                />
              </div>
            </FormGroup>

            <FormGroup>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0.001"
                label="Quantity"
                required
                placeholder="0.000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <TextArea
                id="notes"
                label="Notes / Reason"
                rows={3}
                placeholder="e.g., Opening stock, Damage, Theft, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormGroup>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              variant="primary"
            >
              {loading ? 'Adjusting Stock...' : 
                adjustmentType === 'IN' ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Add to Stock
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    Remove from Stock
                  </>
                )
              }
            </Button>
          </form>
        </Card>

        {/* Current Stock Summary */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Current Stock Levels</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{product.stockQuantity}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">In Stock</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Adjustments History */}
      {adjustments.length > 0 && (
        <Card padding="none">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Adjustments</h2>
            </div>
            <Badge>{adjustments.length}</Badge>
          </div>
          <Table scrollable>
            <TableHeader sticky>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Notes</TableHead>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    {new Date(adj.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <p>{adj.product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{adj.product.unit}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {adj.adjustmentType === 'IN' ? (
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
                  <TableCell className={`text-right font-semibold ${
                    adj.adjustmentType === 'IN' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {adj.adjustmentType === 'IN' ? '+' : '-'}{adj.quantity}
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">
                    {adj.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
