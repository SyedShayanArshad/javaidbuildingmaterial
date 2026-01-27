"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, FileText, Printer, Download } from "lucide-react";
import {
  generateSalesInvoice,
  printInvoice,
  downloadPDF,
} from "@/lib/pdf-generator";

interface SaleItem {
  id: string;
  productId: string;
  product: {
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  customer: {
    name: string;
    phone: string | null;
    balance: number;
  } | null;
  saleDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
  items: SaleItem[];
  createdAt: string;
  isWalkIn: boolean;
  walkInCustomerName: string | null;
}

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const fetchPaymentHistory = async () => {
    const res = await fetch(`/api/payment-history?saleId=${params.id}`, {
      credentials: "include",
    });
    const data = await res.json();
    setPaymentHistory(data);
  };

  useEffect(() => {
    if (params.id) {
      fetchSale();
      fetchPaymentHistory();
    }
  }, [params.id]);

  const fetchSale = async () => {
    try {
      const response = await fetch(`/api/sales/${params.id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Sale not found");
      }
      const data = await response.json();
      setSale(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!sale) return;

    const invoiceData = {
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.saleDate).toLocaleDateString("en-PK"),
      customerName: sale.customer?.name || sale.walkInCustomerName || "Walk-in Customer",
      customerPhone: sale.customer?.phone || "",
      customerAddress: "",
      customerPreviousBalance: sale.customer ? sale.customer.balance - sale.dueAmount : 0,
      items: sale.items.map((item) => ({
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
      paymentHistory: paymentHistory,
    };

    const doc = generateSalesInvoice(invoiceData);
    printInvoice(doc, `Invoice-${sale.invoiceNumber}.pdf`);
  };

  const handleDownloadInvoice = () => {
    if (!sale) return;

    const invoiceData = {
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.saleDate).toLocaleDateString("en-PK"),
      customerName: sale.customer?.name || sale.walkInCustomerName || "Walk-in Customer",
      customerPhone: sale.customer?.phone || "",
      customerAddress: "",
      customerPreviousBalance: sale.customer ? sale.customer.balance - sale.dueAmount : 0,
      items: sale.items.map((item) => ({
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
      paymentHistory: paymentHistory,
    };

    const doc = generateSalesInvoice(invoiceData);
    downloadPDF(doc, `Invoice-${sale.invoiceNumber}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">
          Loading sale details...
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="text-center py-12">
        <div className="text-rose-600 dark:text-rose-400 mb-4">
          {error || "Sale not found"}
        </div>
        <Link
          href="/sales"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
        >
          ← Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/sales"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sales
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Sale Details
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Invoice: {sale.invoiceNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrintInvoice}
              className="bg-cyan-600 dark:bg-cyan-700 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            <button
              onClick={handleDownloadInvoice}
              className="bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Customer Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-base text-slate-500 dark:text-slate-400">
            Name:{" "}
            <span className="font-semibold text-slate-900 dark:text-white text-lg">
              {sale.customer?.name || sale.walkInCustomerName || "Walk-in Customer"}
            </span>
          </div>

          <div className="text-base text-slate-500 dark:text-slate-400">
            Phone:{" "}
            <span className="font-semibold text-slate-900 dark:text-white text-lg">
              {sale.customer?.phone || "N/A"}
            </span>
          </div>

          <div className="text-base text-slate-500 dark:text-slate-400">
            Balance:{" "}
            <span className="font-semibold text-emerald-600 text-lg">
              {sale.customer?.balance?.toLocaleString("en-PK", {
                minimumFractionDigits: 2,
              }) ?? "0.00"}
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
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {item.product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-900 dark:text-slate-100">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    Rs.{" "}
                    {item.unitPrice.toLocaleString("en-PK", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
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
            {sale.totalAmount.toLocaleString("en-PK", {
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
            {sale.paidAmount.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            Due Amount
          </div>
          <div
            className={`text-2xl font-bold ${sale.dueAmount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
          >
            Rs.{" "}
            {sale.dueAmount.toLocaleString("en-PK", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      {sale.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Notes
          </h2>
          <p className="text-slate-700 dark:text-slate-300">{sale.notes}</p>
        </div>
      )}
    </div>
  );
}
