'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Phone } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  TextArea,
  PageHeader,
  LoadingSpinner,
  Alert,
  FormGroup,
  FormSection
} from '@/components/ui';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Customer not found');

      const data = await response.json();
      setFormData({
        name: data.name,
        phone: data.phone || '',
        address: data.address || '',
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
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      router.push('/customers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <LoadingSpinner fullScreen text="Loading customer details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/customers')} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader title="Edit Customer" description="Update customer information and contact details" />

      {/* Form Card */}
      <div className="max-w-3xl">
        <Card>
          {error && (
            <div className="mb-6">
              <Alert variant="danger" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection title="Customer Information" description="Basic customer details">

              {/* Row 1: Name | Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup>
                  <Input
                    id="name"
                    label="Customer Name"
                    required
                    placeholder="Enter customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormGroup>

                <FormGroup>
                  <Input
                    id="phone"
                    type="tel"
                    label="Phone Number"
                    placeholder="+92 3001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    icon={<Phone className="w-4 h-4" />}
                  />
                </FormGroup>
              </div>

              {/* Row 2: Address (full width) */}
              <FormGroup>
                <TextArea
                  id="address"
                  label="Address"
                  rows={3}
                  placeholder="Enter customer address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormGroup>

            </FormSection>

            {/* Row 3: Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={() => router.push('/customers')} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} variant="primary" className="flex-1">
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
