"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  Printer,
} from "lucide-react";
import { generatePurchaseOrder, printInvoice } from "@/lib/pdf-generator";

import {
  Card,
  Button,
  SearchInput,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageHeader,
  LoadingSpinner,
  EmptyState,
  Badge,
} from "@/components/ui";

interface Purchase {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  vendor: {
    name: string;
  };
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/purchases", {
        credentials: "include",
      });
      const data = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = purchases.reduce((sum, p) => sum + p.dueAmount, 0);
  const handlePrintPDF = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`, {
        credentials: "include",
      });
      const purchase = await res.json();

      const paymentRes = await fetch(
        `/api/payment-history?purchaseId=${purchaseId}`,
        { credentials: "include" },
      );
      const paymentHistory = await paymentRes.json();

      const doc = generatePurchaseOrder({
        poNumber: purchase.invoiceNumber,
        date: new Date(purchase.purchaseDate).toLocaleDateString("en-PK"),
        vendorName: purchase.vendor.name,
        vendorPhone: purchase.vendor.phone,
        vendorPreviousBalance: purchase.vendor.balance - purchase.dueAmount,
        items: purchase.items.map((item: any) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unit: "",
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        totalAmount: purchase.totalAmount,
        paidAmount: purchase.paidAmount,
        dueAmount: purchase.dueAmount,
        notes: purchase.notes || "",
        paymentHistory,
      });

      // ✅ PRINT (not download)
      printInvoice(doc, `PO-${purchase.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  return (
    <>
      {loading && (
        <LoadingSpinner fullScreen size="lg" text="Loading purchases..." />
      )}

      <div className="space-y-6">
        <PageHeader
          title="Purchases"
          description="Manage purchase orders and inventory receipts"
          actions={
            <Button onClick={() => (window.location.href = "/purchases/new")}>
              <Plus className="w-4 h-4" />
              New Purchase
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover gradient>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Purchases
                </p>
                <p className="text-2xl font-bold mt-2">
                  Rs.{" "}
                  {totalPurchases.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card hover gradient>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  Rs.{" "}
                  {totalPaid.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card hover gradient>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Payable
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                  Rs.{" "}
                  {totalDue.toLocaleString("en-PK", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <SearchInput
            placeholder="Search by vendor or invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
          />
        </Card>

        {/* Purchases Table */}
        <Card padding="none">
          {!loading && filteredPurchases.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-16 h-16" />}
              title="No purchases found"
              description={
                searchQuery
                  ? "Try adjusting your search terms"
                  : "Create your first purchase order to get started"
              }
              action={
                !searchQuery ? (
                  <Button
                    onClick={() => (window.location.href = "/purchases/new")}
                  >
                    <Plus className="w-4 h-4" />
                    Create Purchase Order
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table scrollable>
              <TableHeader sticky>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableHeader>

              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono font-medium text-primary-600">
                      {purchase.invoiceNumber}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {purchase.vendor.name.charAt(0).toUpperCase()}
                        </div>
                        {purchase.vendor.name}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      Rs.{" "}
                      {purchase.totalAmount.toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="text-right text-green-600">
                      Rs.{" "}
                      {purchase.paidAmount.toLocaleString("en-PK", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={
                          purchase.dueAmount > 0
                            ? "text-red-600 font-semibold"
                            : "text-gray-500"
                        }
                      >
                        Rs.{" "}
                        {purchase.dueAmount.toLocaleString("en-PK", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      {purchase.dueAmount > 0 ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : (
                        <Badge variant="success">Paid</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        onClick={() =>
                          (window.location.href = `/purchases/${purchase.id}`)
                        }
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        onClick={() => handlePrintPDF(purchase.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Printer className="w-4 h-4 text-cyan-600" />
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
