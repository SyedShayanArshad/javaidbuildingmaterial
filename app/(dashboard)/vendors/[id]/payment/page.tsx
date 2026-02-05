'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast, Button, LoadingSpinner } from '@/components/ui';

interface Purchase {
  id: string;
  invoiceNumber: string;
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

interface Vendor {
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

export default function VendorPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
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
      fetchVendor();
      fetchUnpaidPurchases();
    }
  }, [params.id]);

  useEffect(() => {
    if (selectedPurchase) {
      fetchPaymentHistory();
    }
  }, [selectedPurchase]);

  const fetchVendor = async () => {
    try {
      const response = await fetch(`/api/vendors/${params.id}`, { credentials: 'include' });
      const data = await response.json();
      setVendor(data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
    }
  };

  const fetchUnpaidPurchases = async () => {
  setLoading(true);

  try {
    const response = await fetch(
      `/api/purchases/by-vendor/${params.id}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch unpaid purchases');
    }
    const purchases: Purchase[] = await response.json();
    setPurchases(purchases);
  } catch (error) {
    console.error('Error fetching unpaid purchases:', error);
    setPurchases([]);
  } finally {
    setLoading(false);
  }
};


  const fetchPaymentHistory = async () => {
    if (!selectedPurchase) return;
    try {
      const response = await fetch(`/api/payment-history?purchaseId=${selectedPurchase.id}`, { credentials: 'include' });
      const data = await response.json();
      setPaymentHistory(data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const handlePurchaseSelect = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setPaymentData({
      amount: purchase.dueAmount.toString(),
      paymentMode: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    setError('');
    setSubmitting(true);

    try {
      const amount = parseFloat(paymentData.amount);
      if (amount <= 0 || amount > selectedPurchase.dueAmount) {
        throw new Error(`Amount must be between 0 and ${selectedPurchase.dueAmount}`);
      }

      const response = await fetch('/api/payment-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          purchaseId: selectedPurchase.id,
          ...paymentData,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully!');
      
      fetchVendor();
      fetchUnpaidPurchases();
      fetchPaymentHistory();
      
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
    if (loading) {
        return (
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" text="Loading..." />
          </div>
        );
      }
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-600 dark:text-rose-400 mb-4">Vendor not found</div>
        <Link href="/vendors" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
          ← Back to Vendors
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/vendors"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Vendors
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Update Payment</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Record payment for vendor purchases</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Vendor Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
            <p className="text-lg font-medium text-slate-900 dark:text-white">{vendor.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
            <p className="text-lg font-medium text-slate-900 dark:text-white">{vendor.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Balance</p>
            <p className={`text-lg font-bold ${vendor.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              Rs. {vendor.balance.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Unpaid Purchase Orders</h2>
          {purchases.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No unpaid purchases</p>
          ) : (
            <div className="space-y-2">
              {purchases.map((purchase) => (
                <button
                  key={purchase.id}
                  onClick={() => handlePurchaseSelect(purchase)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    selectedPurchase?.id === purchase.id
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{purchase.invoiceNumber}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(purchase.purchaseDate).toLocaleDateString('en-PK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Due Amount</p>
                      <p className="font-bold text-rose-600 dark:text-rose-400">
                        Rs. {purchase.dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total: Rs. {purchase.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })} | 
                    Paid: Rs. {purchase.paidAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {selectedPurchase ? (
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
      max={selectedPurchase.dueAmount}
      required
      className="input"
      placeholder="0.00"
      value={paymentData.amount}
      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
    />
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
      Maximum: Rs. {selectedPurchase.dueAmount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
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
                Select a purchase order to record payment
              </p>
            </div>
          )}

          {selectedPurchase && paymentHistory.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment History</h3>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="border-l-4 border-emerald-500 dark:border-emerald-600 pl-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Rs. {payment.amount.toLocaleString('en-PK', { minimumFractionDigits: 1 })}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(payment.paymentDate).toLocaleDateString('en-PK')} • {payment.paymentMode}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                        <p>Due: Rs. {payment.balanceBefore.toFixed(1)}</p>
                        <p>→ Rs. {payment.balanceAfter.toFixed(1)}</p>
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
