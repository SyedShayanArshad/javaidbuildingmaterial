'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  PageHeader,
  Alert,
  FormGroup,
  FormRow,
  FormSection
} from '@/components/ui';

const PRODUCT_UNITS = ['BAG', 'KG', 'TON', 'PIECE', 'METER', 'SQFT', 'CUFT'];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    unit: 'BAG',
    minimumStockLevel: '0',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/products')} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <PageHeader title="Add New Product" description="Create a new inventory item" />

      <div className="max-w-3xl">
        <Card>
          {error && <div className="mb-6"><Alert variant="danger" onClose={() => setError('')}>{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection title="Product Information" description="Basic product details">
              <FormGroup>
                <Input
                  id="name"
                  label="Product Name"
                  required
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormGroup>
              <FormRow>
                <Select
                  id="unit"
                  label="Unit of Measurement"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  options={PRODUCT_UNITS.map(unit => ({ value: unit, label: unit }))}
                />
                <Input
                  id="minimumStockLevel"
                  type="number"
                  step="0.001"
                  label="Minimum Quantity"
                  required
                  placeholder="0.000"
                  value={formData.minimumStockLevel}
                  onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
                  helperText="Alert when stock falls below this level"
                />
              </FormRow>
            </FormSection>
            <Alert variant="info">
              <strong>Initial stock:</strong> Stock quantity starts at 0. Add stock through purchase orders or stock adjustments.
            </Alert>

            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={() => router.push('/products')} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} variant="primary" className="flex-1">
                <Plus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
