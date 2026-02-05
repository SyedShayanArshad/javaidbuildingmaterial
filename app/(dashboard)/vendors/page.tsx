'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, DollarSign, Users as UsersIcon, Phone, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors', { credentials: 'include' });
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.phone && vendor.phone.includes(searchTerm));
    return matchesSearch && vendor.isActive;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading vendors..." />
      </div>
    );
  }

  const totalPayable = vendors.reduce((sum, v) => sum + (v.balance > 0 ? v.balance : 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage your suppliers and track payables"
        actions={
          <Link href="/vendors/new">
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
              Add Vendor
            </Button>
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendors.filter(v => v.isActive).length}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Payables</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                Rs. {totalPayable.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <SearchInput
          placeholder="Search vendors by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
        />
      </Card>

      {/* Vendors Table */}
      <Card padding="none">
        <Table scrollable>
          <TableHeader sticky>
            <TableHead>Vendor Details</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Current Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {filteredVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{vendor.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.phone ? (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      {vendor.phone}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {vendor.address ? (
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 max-w-xs">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{vendor.address}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${
                      vendor.balance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : vendor.balance < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      Rs. {Math.abs(vendor.balance).toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                    </p>
                    {vendor.balance > 0 && (
                      <Badge variant="danger" size="sm">Payable</Badge>
                    )}
                    {vendor.balance < 0 && (
                      <Badge variant="success" size="sm">Advance</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/vendors/${vendor.id}/payment`}>
                      <button className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Payment">
                        <DollarSign className="w-5 h-5" />
                      </button>
                    </Link>
                    <Link href={`/vendors/${vendor.id}`}>
                      <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-5 h-5" />
                      </button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredVendors.length === 0 && (
          <EmptyState
            icon={<UsersIcon className="w-16 h-16" />}
            title="No vendors found"
            description={searchTerm ? "Try adjusting your search terms" : "Get started by adding your first vendor"}
            action={
              !searchTerm && (
                <Link href="/vendors/new">
                  <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                    Add Vendor
                  </Button>
                </Link>
              )
            }
          />
        )}
      </Card>

      {filteredVendors.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredVendors.length}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{vendors.filter(v => v.isActive).length}</span> vendors
        </div>
      )}
    </div>
  );
}



