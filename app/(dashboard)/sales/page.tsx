'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, ShoppingBag, Calendar, User, UserCheck,Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import {
  generateSalesInvoice,
  printInvoice,
} from "@/lib/pdf-generator";

// ✅ Updated interface to match Prisma schema
interface Sale {
  id: string;
  customerId: string | null; // Can be null for walk-in
  invoiceNumber: string;
  customer: {
    name: string;
  } | null; // Can be null for walk-in
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
  isWalkIn: boolean; // Walk-in flag
  walkInCustomerName: string | null; // Walk-in customer name
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales', { credentials: 'include' });
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe filtering with null checks
  const filteredSales = sales.filter((sale) => {
    const customerName = sale.customer?.name || sale.walkInCustomerName || 'Walk-in Customer';
    const searchLower = searchQuery.toLowerCase();
    
    return (
      customerName.toLowerCase().includes(searchLower) ||
      sale.invoiceNumber.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading sales..." />
      </div>
    );
  }
const handlePrintSale = async (saleId: string) => {
  try {
    // sale fetch
    const res = await fetch(`/api/sales/${saleId}`, {
      credentials: "include",
    });
    const sale = await res.json();

    // payment history fetch
    const payRes = await fetch(
      `/api/payment-history?saleId=${saleId}`,
      { credentials: "include" }
    );
    const paymentHistory = await payRes.json();

    const invoiceData = {
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.saleDate).toLocaleDateString("en-PK"),
      customerName:
        sale.customer?.name ||
        sale.walkInCustomerName ||
        "Walk-in Customer",
      customerPhone: sale.customer?.phone || "",
      customerAddress: "",
      customerPreviousBalance: sale.customer
        ? sale.customer.balance - sale.dueAmount
        : 0,
      items: sale.items.map((item: any) => ({
        productName: item.product.name,
        quantity: item.quantity,
        unit: "",
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: sale.totalAmount,
      paidAmount: sale.paidAmount,
      dueAmount: sale.dueAmount,
      notes: sale.notes || "",
      paymentHistory,
    };

    const doc = generateSalesInvoice(invoiceData);

    // ✅ PRINT
    printInvoice(doc, `Invoice-${sale.invoiceNumber}.pdf`);
  } catch (err) {
    console.error("Sale print failed", err);
  }
};

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalDue = sales.reduce((sum, s) => sum + s.dueAmount, 0);
  
  // ✅ Additional metrics
  const registeredCustomerSales = sales.filter(s => !s.isWalkIn).length;
  const walkInSales = sales.filter(s => s.isWalkIn).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Manage sales orders and customer invoices"
        actions={
          <Link href="/sales/new">
            <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
              New Sale
            </Button>
          </Link>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{sales.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {registeredCustomerSales} registered · {walkInSales} walk-in
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Rs. {totalSales.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Rs. {sales.reduce((sum, s) => sum + s.paidAmount, 0).toLocaleString('en-PK', { minimumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Due</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                Rs. {totalDue.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <SearchInput
          placeholder="Search by customer or invoice number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />
      </Card>

      {/* Sales Table */}
      <Card padding="none">
        <Table scrollable>
          <TableHeader sticky>
            <TableHead>Invoice No.</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Due</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => {
              // ✅ Safely get customer name with fallbacks
              const customerName = sale.customer?.name || sale.walkInCustomerName || 'Walk-in Customer';
              const isWalkIn = sale.isWalkIn || !sale.customer;
              
              return (
                <TableRow key={sale.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {sale.invoiceNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customerName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isWalkIn ? (
                      <Badge variant="info" size="sm">
                        Walk-in
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        Registered
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Rs. {sale.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                  </TableCell>
                  <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                    Rs. {sale.paidAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.dueAmount > 0 ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        Rs. {sale.dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                      </span>
                    ) : (
                      <Badge variant="success" size="sm">Paid</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center flex justify-center gap-2">
  <Link href={`/sales/${sale.id}`}>
    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1">
      <Eye className="w-4 h-4" />
      <span className="text-sm">View</span>
    </button>
  </Link>

  <button
    onClick={() => handlePrintSale(sale.id)}
    className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg inline-flex items-center gap-1"
  >
    <Printer className="w-4 h-4" />
    <span className="text-sm">Print</span>
  </button>
</TableCell>

                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredSales.length === 0 && (
          <EmptyState
            icon={<ShoppingBag className="w-16 h-16" />}
            title="No sales found"
            description={searchQuery ? "Try adjusting your search terms" : "Create your first sales invoice to get started"}
            action={
              !searchQuery && (
                <Link href="/sales/new">
                  <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                    New Sale
                  </Button>
                </Link>
              )
            }
          />
        )}
      </Card>

      {filteredSales.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredSales.length}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{sales.length}</span> sales
        </div>
      )}
    </div>
  );
}


