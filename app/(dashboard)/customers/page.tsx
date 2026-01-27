'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, DollarSign, UserCircle, Phone, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', { credentials: 'include' });
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));
    return matchesSearch && customer.isActive;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading customers..." />
      </div>
    );
  }

  const totalReceivable = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customers and track receivables"
        actions={
          <Link href="/customers/new">
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
              Add Customer
            </Button>
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.filter(c => c.isActive).length}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
              <UserCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Receivables</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Rs. {totalReceivable.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <SearchInput
          placeholder="Search customers by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
        />
      </Card>

      {/* Customers Table */}
      <Card padding="none">
        <Table scrollable>
          <TableHeader sticky>
            <TableHead>Customer Details</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Current Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {customer.phone ? (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.address ? (
                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 max-w-xs">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${
                      customer.balance > 0
                        ? 'text-green-600 dark:text-green-400'
                        : customer.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      Rs. {Math.abs(customer.balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    </p>
                    {customer.balance > 0 && (
                      <Badge variant="success" size="sm">Receivable</Badge>
                    )}
                    {customer.balance < 0 && (
                      <Badge variant="danger" size="sm">Advance</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/customers/${customer.id}/payment`}>
                      <button className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Payment">
                        <DollarSign className="w-5 h-5" />
                      </button>
                    </Link>
                    <Link href={`/customers/${customer.id}`}>
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

        {filteredCustomers.length === 0 && (
          <EmptyState
            icon={<UserCircle className="w-16 h-16" />}
            title="No customers found"
            description={searchTerm ? "Try adjusting your search terms" : "Get started by adding your first customer"}
            action={
              !searchTerm && (
                <Link href="/customers/new">
                  <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                    Add Customer
                  </Button>
                </Link>
              )
            }
          />
        )}
      </Card>

      {filteredCustomers.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredCustomers.length}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{customers.filter(c => c.isActive).length}</span> customers
        </div>
      )}
    </div>
  );
}
