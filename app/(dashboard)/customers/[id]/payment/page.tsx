'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Calendar, FileText } from 'lucide-react';
import { useToast, Button } from '@/components/ui';

interface Sale {
  id: string;
  invoiceNumber: string;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  notes: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function CustomerPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
      fetchUnpaidSales();
    }
  }, [params.id]);

  useEffect(() => {
    if (selectedSale) {
      fetchPaymentHistory();
    }
  }, [selectedSale]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`, { credentials: 'include' });
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const fetchUnpaidSales = async () => {
    try {
      const response = await fetch(`/api/sales?customerId=${params.id}`, { credentials: 'include' });
      const data = await response.json();
      // Filter only sales with due amount
      const unpaidSales = data.filter((sale: Sale) => sale.dueAmount > 0);
      setSales(unpaidSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!selectedSale) return;
    try {
      const response = await fetch(`/api/payment-history?saleId=${selectedSale.id}`, { credentials: 'include' });
      const data = await response.json();
      setPaymentHistory(data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const handleSaleSelect = (sale: Sale) => {
    setSelectedSale(sale);
    setPaymentData({
      amount: sale.dueAmount.toString(),
      paymentMode: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    setError('');
    setSubmitting(true);

    try {
      const amount = parseFloat(paymentData.amount);
      if (amount <= 0 || amount > selectedSale.dueAmount) {
        throw new Error(`Amount must be between 0 and ${selectedSale.dueAmount}`);
      }

      const response = await fetch('/api/payment-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          saleId: selectedSale.id,
          ...paymentData,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

    toast.success('Payment recorded successfully!');
      fetchPaymentHistory();
      
      // Reset form
      setPaymentData({
        amount: '',
        paymentMode: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-600 dark:text-rose-400 mb-4">Customer not found</div>
        <Link href="/customers" className="text-emerald-600 dark:text-emerald-400">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/customers"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Customers
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Update Payment</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Record payment for customer invoices</p>
      </div>

      {/* Customer Info */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Customer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
            <p className="text-lg font-medium text-slate-900 dark:text-white">{customer.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
            <p className="text-lg font-medium text-slate-900 dark:text-white">{customer.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Balance</p>
            <p className={`text-lg font-bold ${customer.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              Rs. {customer.balance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unpaid Invoices */}
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Unpaid Invoices</h2>
          {sales.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No unpaid invoices</p>
          ) : (
            <div className="space-y-2">
              {sales.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => handleSaleSelect(sale)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    selectedSale?.id === sale.id
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{sale.invoiceNumber}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(sale.saleDate).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Due Amount</p>
                      <p className="font-bold text-rose-600 dark:text-rose-400">
                        Rs. {sale.dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total: Rs. {sale.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })} | 
                    Paid: Rs. {sale.paidAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div>
          {selectedSale ? (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Record Payment</h2>
              
              {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Row 1: Amount */}
  <div className="flex flex-col">
    <label className="label">Amount *</label>
    <input
      type="number"
      step="0.01"
      min="0.01"
      max={selectedSale.dueAmount}
      required
      className="input"
      placeholder="0.00"
      value={paymentData.amount}
      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
    />
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
      Maximum: Rs. {selectedSale.dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
    </p>
  </div>

  {/* Row 1: Payment Mode */}
  <div className="flex flex-col">
    <label className="label">Payment Mode</label>
    <select
      className="input"
      value={paymentData.paymentMode}
      onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
    >
      <option value="CASH">Cash</option>
      <option value="BANK">Bank Transfer</option>
      <option value="ONLINE">Online</option>
    </select>
  </div>

  {/* Row 2: Notes (full width) */}
  <div className="flex flex-col md:col-span-2">
    <label className="label">Notes</label>
    <textarea
      rows={3}
      className="input"
      placeholder="Payment notes..."
      value={paymentData.notes}
      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
    />
  </div>

  {/* Row 3: Payment Date */}
  <div className="flex flex-col">
    <label className="label">Payment Date *</label>
    <input
      type="date"
      required
      className="input"
      value={paymentData.paymentDate}
      onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
    />
  </div>

  {/* Row 3: Submit Button */}
  <div className="flex items-end">
    <button
      type="submit"
      disabled={submitting}
      className="btn btn-primary w-full disabled:opacity-50"
    >
      {submitting ? 'Recording...' : 'Record Payment'}
    </button>
  </div>
</form>

            </div>
          ) : (
            <div className="card">
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                Select an invoice to record payment
              </p>
            </div>
          )}

          {/* Payment History */}
          {selectedSale && paymentHistory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment History</h3>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="border-l-4 border-emerald-500 dark:border-emerald-400 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Rs. {payment.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(payment.paymentDate).toLocaleDateString('en-PK')} • {payment.paymentMode}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                        <p>Due: Rs. {payment.balanceBefore.toFixed(2)}</p>
                        <p>→ Rs. {payment.balanceAfter.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
