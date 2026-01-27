'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  PageHeader,
  LoadingSpinner,
  Alert,
  FormGroup,
  FormRow,
  FormSection
} from '@/components/ui';

const PRODUCT_UNITS = ['BAG', 'KG', 'TON', 'PIECE', 'METER', 'SQFT', 'CUFT'];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    unit: 'BAG',
    minimumStockLevel: '0',
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Product not found');
      
      const data = await response.json();
      setFormData({
        name: data.name,
        unit: data.unit,
        minimumStockLevel: data.minimumStockLevel.toString(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <LoadingSpinner fullScreen text="Loading product details..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push('/products')}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <PageHeader
        title="Edit Product"
        description="Update product information and pricing"
      />

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
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={() => router.push('/products')}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              variant="primary"
              className="flex-1"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
    </div>
  );
}
