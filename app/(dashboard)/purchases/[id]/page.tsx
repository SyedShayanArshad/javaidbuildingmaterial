"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Printer,
  Download,
} from "lucide-react";
import {
  generatePurchaseOrder,
  printInvoice,
  downloadPDF,
} from "@/lib/pdf-generator";

interface PurchaseItem {
  id: string;
  productId: string;
  product: {
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendor: {
    name: string;
    phone: string;
    balance: number;
  };
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
  items: PurchaseItem[];
  createdAt: string;
}

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

const fetchPaymentHistory = async () => {
  const res = await fetch(`/api/payment-history?purchaseId=${params.id}`, {
    credentials: "include",
  });
  const data = await res.json();
  setPaymentHistory(data);
};

  useEffect(() => {
    if (params.id) {
      fetchPurchase();
      fetchPaymentHistory();
    }
  }, [params.id]);

  const fetchPurchase = async () => {
    try {
      const response = await fetch(`/api/purchases/${params.id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Purchase not found");
      }
      const data = await response.json();
      setPurchase(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPO = () => {
    if (!purchase) return;

    const poData = {
  poNumber: purchase.invoiceNumber,
  date: new Date(purchase.purchaseDate).toLocaleDateString("en-PK"),
  vendorName: purchase.vendor.name,
  vendorPhone: purchase.vendor.phone,
  vendorPreviousBalance: purchase.vendor.balance - purchase.dueAmount,

  items: purchase.items.map((item) => ({
    productName: item.product.name,
    quantity: item.quantity,
    unit: "",
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  })),

  totalAmount: purchase.totalAmount,
  paidAmount: purchase.paidAmount,
  dueAmount: purchase.dueAmount, // ✅ REQUIRED
  notes: purchase.notes || "",
  paymentHistory: paymentHistory,
};


    const doc = generatePurchaseOrder(poData);
    printInvoice(doc, `PO-${purchase.invoiceNumber}.pdf`);
  };

  const handleDownloadPO = () => {
    if (!purchase) return;

    const poData = {
  poNumber: purchase.invoiceNumber,
  date: new Date(purchase.purchaseDate).toLocaleDateString("en-PK"),
  vendorName: purchase.vendor.name,
  vendorPhone: purchase.vendor.phone,
  vendorPreviousBalance: purchase.vendor.balance - purchase.dueAmount,

  items: purchase.items.map((item) => ({
    productName: item.product.name,
    quantity: item.quantity,
    unit: "",
    unitPrice: item.unitPrice,
    totalPrice: item.totalPrice,
  })),

  totalAmount: purchase.totalAmount,
  paidAmount: purchase.paidAmount,
  dueAmount: purchase.dueAmount, // ✅ REQUIRED
  notes: purchase.notes || "",
  paymentHistory: paymentHistory,
};


    const doc = generatePurchaseOrder(poData);
    downloadPDF(doc, `PO-${purchase.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">
          Loading purchase details...
        </div>
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-600 dark:text-rose-400 mb-4">
          {error || "Purchase not found"}
        </div>
        <Link
          href="/purchases"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          ← Back to Purchases
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/purchases"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Purchases
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Purchase Details
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Invoice: {purchase.invoiceNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrintPO}
              className="bg-cyan-600 dark:bg-cyan-700 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print PO
            </button>
            <button
              onClick={handleDownloadPO}
              className="bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Vendor Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-base text-slate-500 dark:text-slate-400">
            Name:{" "}
            <span className="font-semibold text-slate-900 dark:text-white text-lg">
              {purchase.vendor.name || "N/A"}
            </span>
          </div>

          <div className="text-base text-slate-500 dark:text-slate-400">
            Phone:{" "}
            <span className="font-semibold text-slate-900 dark:text-white text-lg">
              {purchase.vendor.phone || "N/A"}
            </span>
          </div>

          <div className="text-base text-slate-500 dark:text-slate-400">
            Remaining Balance:{" "}
            <span className="font-semibold text-red-600 text-lg">
              {purchase.vendor.balance || "N/A"}
            </span>
          </div>
        </div>
      </div>
      {/* Items */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {purchase.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {item.product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-900 dark:text-slate-100">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                    Rs.{" "}
                    {item.unitPrice.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                    Rs.{" "}
                    {item.totalPrice.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Total Amount
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            Rs.{" "}
            {purchase.totalAmount.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Paid Amount
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Rs.{" "}
            {purchase.paidAmount.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Due Amount
          </div>
          <div
            className={`text-2xl font-bold ${purchase.dueAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
          >
            Rs.{" "}
            {purchase.dueAmount.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      {purchase.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes
          </h2>
          <p className="text-slate-700 dark:text-slate-300">{purchase.notes}</p>
        </div>
      )}
    </div>
  );
}
