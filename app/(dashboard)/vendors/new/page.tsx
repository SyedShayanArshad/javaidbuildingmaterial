'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Phone, MapPin, DollarSign } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  TextArea,
  PageHeader,
  Alert,
  FormGroup,
  FormRow,
  FormSection
} from '@/components/ui';

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create vendor');
      }

      router.push('/vendors');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/vendors')} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <PageHeader title="Add New Vendor" description="Create a new supplier" />

      <div className="max-w-3xl">
        <Card>
          {error && <div className="mb-6"><Alert variant="danger" onClose={() => setError('')}>{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection title="Vendor Information" description="Basic vendor details">
  <div className="flex gap-4 w-full">
    <FormGroup className="flex-1">
      <Input
        id="name"
        label="Vendor Name"
        required
        placeholder="Enter vendor name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </FormGroup>

    <FormGroup className="flex-1">
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

  <FormGroup>
    <TextArea
      id="address"
      label="Address"
      rows={3}
      placeholder="Enter vendor address"
      value={formData.address}
      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
    />
  </FormGroup>
</FormSection>


            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={() => router.push('/vendors')} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} variant="primary" className="flex-1">
                <Plus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Vendor'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
