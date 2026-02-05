"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Package,
  Users,
  Download,
  BarChart3,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from "lucide-react";
import {
  Card,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PageHeader,
  LoadingSpinner,
  Tabs,
  Badge,
  Input,
} from "@/components/ui";

interface StockReport {
  id: string;
  name: string;
  stockQuantity: number;
  unit: string;
  minimumStockLevel: number;
}

interface PartyLedger {
  id: string;
  name: string;
  balance: number;
  type: "vendor" | "customer";
}

interface ProfitLossData {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: string;
  salesCount: number;
}

interface ProductProfitData {
  productId: string;
  productName: string;
  unit: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
}

interface SalesByCustomerData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  salesCount: number;
}

interface PurchaseByVendorData {
  vendorId: string;
  vendorName: string;
  vendorPhone: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  purchaseCount: number;
}

// ✅ NEW: Walk-in Sales Interfaces
interface WalkInSalesData {
  sales: Array<{
    id: string;
    invoiceNumber: string;
    walkInCustomerName: string;
    saleDate: string;
    totalAmount: number;
    paidAmount: number;
  }>;
  summary: {
    totalSales: number;
    totalPaid: number;
    salesCount: number;
  };
}

interface SalesComparisonData {
  walkIn: {
    count: number;
    total: number;
    average: number;
  };
  registered: {
    count: number;
    total: number;
    average: number;
  };
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("stock");
  const [stockReport, setStockReport] = useState<StockReport[]>([]);
  const [partyLedger, setPartyLedger] = useState<PartyLedger[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [productProfit, setProductProfit] = useState<ProductProfitData[]>([]);
  const [salesByCustomer, setSalesByCustomer] = useState<SalesByCustomerData[]>([]);
  const [purchaseByVendor, setPurchaseByVendor] = useState<PurchaseByVendorData[]>([]);
  
  // ✅ NEW: Walk-in States
  const [walkInSales, setWalkInSales] = useState<WalkInSalesData | null>(null);
  const [salesComparison, setSalesComparison] = useState<SalesComparisonData | null>(null);

  // Loading states
  const [loadingProfitLoss, setLoadingProfitLoss] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [vendorPurchases, setVendorPurchases] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCustomerOrders = async (customerId: string) => {
    setLoadingDetails(true);
    const url = new URL("/api/reports", window.location.origin);
    url.searchParams.set("type", "sales-details-by-customer");
    url.searchParams.set("customerId", customerId);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setCustomerOrders(data);
    setLoadingDetails(false);
  };

  const fetchVendorPurchases = async (vendorId: string) => {
    setLoadingDetails(true);
    const url = new URL("/api/reports", window.location.origin);
    url.searchParams.set("type", "purchase-details-by-vendor");
    url.searchParams.set("vendorId", vendorId);
    if (startDate) url.searchParams.set("startDate", startDate);
    if (endDate) url.searchParams.set("endDate", endDate);

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setVendorPurchases(data);
    setLoadingDetails(false);
  };

  const fetchProfitLoss = async () => {
    setLoadingProfitLoss(true);
    try {
      const url = new URL("/api/reports", window.location.origin);
      url.searchParams.set("type", "profit-loss");
      if (startDate) url.searchParams.set("startDate", startDate);
      if (endDate) url.searchParams.set("endDate", endDate);
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setProfitLoss(data);
    } catch (error) {
      console.error("Error fetching profit & loss:", error);
    } finally {
      setLoadingProfitLoss(false);
    }
  };

  useEffect(() => {
    fetchProfitLoss();
  }, [startDate, endDate]);
useEffect(() => {
  const load = async () => {
    setPageLoading(true);
    await fetchReports();
    setPageLoading(false);
  };
  load();
}, [activeTab, startDate, endDate]);


  const fetchReports = async () => {
    try {
      if (activeTab === "stock") {
        const productsRes = await fetch("/api/products", {
          credentials: "include",
        });
        const products = await productsRes.json();
        setStockReport(products);
      } else if (activeTab === "party-ledger") {
        const [vendorsRes, customersRes] = await Promise.all([
          fetch("/api/vendors", { credentials: "include" }),
          fetch("/api/customers", { credentials: "include" }),
        ]);
        const vendors = await vendorsRes.json();
        const customers = await customersRes.json();
        const combined = [
          ...vendors.map((v: any) => ({ ...v, type: "vendor" as const })),
          ...customers.map((c: any) => ({ ...c, type: "customer" as const })),
        ];
        setPartyLedger(combined);
      } else if (activeTab === "product-profit") {
        const url = new URL("/api/reports", window.location.origin);
        url.searchParams.set("type", "product-profit");
        if (startDate) url.searchParams.set("startDate", startDate);
        if (endDate) url.searchParams.set("endDate", endDate);
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setProductProfit(data);
      } else if (activeTab === "sales-by-customer") {
        const url = new URL("/api/reports", window.location.origin);
        url.searchParams.set("type", "sales-by-customer");
        if (startDate) url.searchParams.set("startDate", startDate);
        if (endDate) url.searchParams.set("endDate", endDate);
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setSalesByCustomer(data);
      } else if (activeTab === "purchase-by-vendor") {
        const url = new URL("/api/reports", window.location.origin);
        url.searchParams.set("type", "purchase-by-vendor");
        if (startDate) url.searchParams.set("startDate", startDate);
        if (endDate) url.searchParams.set("endDate", endDate);
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setPurchaseByVendor(data);
      } 
      // ✅ NEW: Walk-in Sales
      else if (activeTab === "walk-in-sales") {
        const url = new URL("/api/reports", window.location.origin);
        url.searchParams.set("type", "walk-in-sales");
        if (startDate) url.searchParams.set("startDate", startDate);
        if (endDate) url.searchParams.set("endDate", endDate);
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setWalkInSales(data);
      } 
      // ✅ NEW: Sales Comparison
      else if (activeTab === "sales-comparison") {
        const url = new URL("/api/reports", window.location.origin);
        url.searchParams.set("type", "sales-comparison");
        if (startDate) url.searchParams.set("startDate", startDate);
        if (endDate) url.searchParams.set("endDate", endDate);
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        setSalesComparison(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const lowStockItems = stockReport.filter(
    (item) => item.stockQuantity < item.minimumStockLevel,
  );

  const totalPayable = partyLedger
    .filter((p) => p.type === "vendor")
    .reduce((sum, p) => sum + parseFloat(p.balance.toString()), 0);

  const totalReceivable = partyLedger
    .filter((p) => p.type === "customer")
    .reduce((sum, p) => sum + parseFloat(p.balance.toString()), 0);

  const handleExportCSV = () => {
    let csvContent = "";
    let filename = "";

    if (activeTab === "stock") {
      csvContent = "Product,Unit,Stock Quantity,Minimum Quantity,Status\n";
      stockReport.forEach((item) => {
        const isLowStock = item.stockQuantity < item.minimumStockLevel;
        csvContent += `${item.name},${item.unit},${item.stockQuantity},${item.minimumStockLevel},${isLowStock ? "Low Stock" : "Normal"}\n`;
      });
      filename = "stock-report.csv";
    } else if (activeTab === "party-ledger") {
      csvContent = "Party,Type,Balance\n";
      partyLedger.forEach((p) => {
        csvContent += `${p.name},${p.type.toUpperCase()},${p.balance}\n`;
      });
      filename = "party-ledger-report.csv";
    } else if (activeTab === "profit-loss" && profitLoss) {
      csvContent = "Metric,Value\n";
      csvContent += `Total Revenue,${profitLoss.totalRevenue}\n`;
      csvContent += `Total Cost,${profitLoss.totalCost}\n`;
      csvContent += `Total Profit,${profitLoss.totalProfit}\n`;
      csvContent += `Profit Margin,${profitLoss.profitMargin}%\n`;
      csvContent += `Sales Count,${profitLoss.salesCount}\n`;
      filename = "profit-loss-report.csv";
    } else if (activeTab === "product-profit") {
      csvContent = "Product,Unit,Quantity Sold,Revenue,Cost,Profit\n";
      productProfit.forEach((p) => {
        csvContent += `${p.productName},${p.unit},${p.quantitySold},${p.revenue},${p.cost},${p.profit}\n`;
      });
      filename = "product-profit-report.csv";
    } else if (activeTab === "sales-by-customer") {
      csvContent = "Customer,Phone,Total Sales,Total Paid,Total Due,Sales Count\n";
      salesByCustomer.forEach((c) => {
        csvContent += `${c.customerName},${c.customerPhone},${c.totalSales},${c.totalPaid},${c.totalDue},${c.salesCount}\n`;
      });
      filename = "sales-by-customer-report.csv";
    } else if (activeTab === "purchase-by-vendor") {
      csvContent = "Vendor,Phone,Total Purchases,Total Paid,Total Due,Purchase Count\n";
      purchaseByVendor.forEach((v) => {
        csvContent += `${v.vendorName},${v.vendorPhone},${v.totalPurchases},${v.totalPaid},${v.totalDue},${v.purchaseCount}\n`;
      });
      filename = "purchase-by-vendor-report.csv";
    } 
    // ✅ NEW: Walk-in Sales CSV
    else if (activeTab === "walk-in-sales" && walkInSales) {
      csvContent = "Invoice #,Customer Name,Date,Total,Paid\n";
      walkInSales.sales.forEach((sale) => {
        csvContent += `${sale.invoiceNumber},${sale.walkInCustomerName},${new Date(sale.saleDate).toLocaleDateString()},${sale.totalAmount},${sale.paidAmount}\n`;
      });
      filename = "walk-in-sales-report.csv";
    } 
    // ✅ NEW: Sales Comparison CSV
    else if (activeTab === "sales-comparison" && salesComparison) {
      csvContent = "Type,Count,Total Revenue,Average Sale\n";
      csvContent += `Walk-in,${salesComparison.walkIn.count},${salesComparison.walkIn.total},${salesComparison.walkIn.average}\n`;
      csvContent += `Registered,${salesComparison.registered.count},${salesComparison.registered.total},${salesComparison.registered.average}\n`;
      filename = "sales-comparison-report.csv";
    }

    if (csvContent) {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <>
  {pageLoading && (
    <LoadingSpinner
      fullScreen
      size="lg"
      text="Loading reports..."
    />
  )}

    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive business insights and performance metrics"
        actions={
          <Button onClick={handleExportCSV} variant="success">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      {/* Profit & Loss Section */}
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profit & Loss Overview
            </h2>
          </div>
          {loadingProfitLoss ? (
            <div className="h-24 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : profitLoss ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-700">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  Rs.{" "}
                  {(typeof profitLoss.totalRevenue === "number"
                    ? profitLoss.totalRevenue
                    : 0
                  ).toLocaleString("en-PK", { minimumFractionDigits: 1 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 p-6 rounded-xl border border-rose-200 dark:border-rose-700">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-1">
                  Total Cost
                </p>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                  Rs.{" "}
                  {(typeof profitLoss.totalCost === "number"
                    ? profitLoss.totalCost
                    : 0
                  ).toLocaleString("en-PK", { minimumFractionDigits: 1 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 p-6 rounded-xl border border-cyan-200 dark:border-cyan-700">
                <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-1">
                  Net Profit
                </p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  Rs.{" "}
                  {(typeof profitLoss.totalProfit === "number"
                    ? profitLoss.totalProfit
                    : 0
                  ).toLocaleString("en-PK", { minimumFractionDigits: 1 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/20 p-6 rounded-xl border border-teal-200 dark:border-teal-700">
                <p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">
                  Profit Margin
                </p>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {profitLoss.profitMargin ? profitLoss.profitMargin : "0"}%
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                  {profitLoss.salesCount ?? 0} sales
                </p>
              </div>
            </div>
          ) : null}
        </Card>

        {/* Date Range Filter */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Date Range Filter
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="flex-1">
                <Input
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          {/* Tabs */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Other Reports
            </h3>
            <Tabs
              tabs={[
                {
                  id: "stock",
                  label: "Stock Report",
                  icon: <Package className="w-4 h-4" />,
                },
                {
                  id: "party-ledger",
                  label: "Party Ledger",
                  icon: <Users className="w-4 h-4" />,
                },
                {
                  id: "product-profit",
                  label: "Product Profitability",
                  icon: <BarChart3 className="w-4 h-4" />,
                },
                {
                  id: "sales-by-customer",
                  label: "Sales by Customer",
                  icon: <ShoppingCart className="w-4 h-4" />,
                },
                {
                  id: "purchase-by-vendor",
                  label: "Purchases by Vendor",
                  icon: <ShoppingBag className="w-4 h-4" />,
                },
                // ✅ NEW TABS
                {
                  id: "walk-in-sales",
                  label: "Walk-in Sales",
                  icon: <ShoppingBag className="w-4 h-4" />,
                },
                {
                  id: "sales-comparison",
                  label: "Sales Comparison",
                  icon: <BarChart3 className="w-4 h-4" />,
                },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </Card>

          {/* Stock Report Tab */}
          {activeTab === "stock" && (
            <div className="space-y-6">
              {loadingTab ? (
                <Card>
                  <div className="h-32 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total Products
                          </p>
                          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                            {stockReport.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                    </Card>
                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Low Stock Alerts
                          </p>
                          <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                            {lowStockItems.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                      </div>
                    </Card>
                  </div>
                  <Card padding="none">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Current Stock Levels
                      </h2>
                    </div>
                    <Table scrollable>
                      <TableHeader sticky>
                        <TableHead>Product</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Minimum Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableHeader>
                      <TableBody>
                        {stockReport.map((item) => {
                          const isLowStock =
                            item.stockQuantity < item.minimumStockLevel;
                          return (
                            <TableRow
                              key={item.id}
                              className={
                                isLowStock
                                  ? "bg-rose-50 dark:bg-rose-900/10"
                                  : ""
                              }
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                      isLowStock
                                        ? "bg-rose-100 dark:bg-rose-900/30"
                                        : "bg-emerald-100 dark:bg-emerald-900/30"
                                    }`}
                                  >
                                    <Package
                                      className={`w-4 h-4 ${isLowStock ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                                    />
                                  </div>
                                  {item.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`font-semibold ${isLowStock ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
                                >
                                  {item.stockQuantity} {item.unit}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-400">
                                {item.minimumStockLevel} {item.unit}
                              </TableCell>
                              <TableCell>
                                {isLowStock ? (
                                  <Badge variant="danger">
                                    <AlertTriangle className="w-3 h-3" />
                                    Low Stock
                                  </Badge>
                                ) : (
                                  <Badge variant="success">Normal</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Party Ledger Tab */}
          {activeTab === "party-ledger" && (
            <div className="space-y-6">
              {loadingTab ? (
                <Card>
                  <div className="h-32 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total Payable
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                            To Vendors
                          </p>
                          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            Rs.{" "}
                            {totalPayable.toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                          <ArrowUpRight className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                      </div>
                    </Card>
                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total Receivable
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                            From Customers
                          </p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            Rs.{" "}
                            {totalReceivable.toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <ArrowDownRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                    </Card>
                  </div>
                  <Card padding="none">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        All Parties
                      </h2>
                    </div>
                    <Table scrollable>
                      <TableHeader sticky>
                        <TableHead>Party Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableHeader>
                      <TableBody>
                        {partyLedger.map((party) => {
                          const hasBalance =
                            parseFloat(party.balance.toString()) > 0;
                          return (
                            <TableRow key={party.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                                      party.type === "vendor"
                                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                        : "bg-gradient-to-br from-cyan-400 to-cyan-600"
                                    }`}
                                  >
                                    {party.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium">
                                    {party.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    party.type === "vendor" ? "default" : "info"
                                  }
                                >
                                  {party.type === "vendor"
                                    ? "Vendor"
                                    : "Customer"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <span
                                  className={`font-semibold ${
                                    hasBalance
                                      ? party.type === "vendor"
                                        ? "text-rose-600 dark:text-rose-400"
                                        : "text-emerald-600 dark:text-emerald-400"
                                      : "text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  Rs.{" "}
                                  {parseFloat(
                                    party.balance.toString(),
                                  ).toLocaleString("en-PK", {
                                    minimumFractionDigits: 1,
                                  })}
                                </span>
                              </TableCell>
                              <TableCell>
                                {hasBalance ? (
                                  party.type === "vendor" ? (
                                    <Badge variant="danger">Payable</Badge>
                                  ) : (
                                    <Badge variant="success">Receivable</Badge>
                                  )
                                ) : (
                                  <Badge>Settled</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Product Profit Tab */}
          {activeTab === "product-profit" && (
            <Card padding="none">
              {loadingTab ? (
                <div className="h-32 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Product Profitability Analysis
                    </h2>
                  </div>
                  <Table scrollable>
                    <TableHeader sticky>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableHeader>
                    <TableBody>
                      {productProfit.map((product) => {
                        const margin =
                          product.revenue > 0
                            ? (
                                (product.profit / product.revenue) *
                                100
                              ).toFixed(1)
                            : "0.0";
                        return (
                          <TableRow key={product.productId}>
                            <TableCell className="font-medium">
                              <div>
                                <p>{product.productName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {product.unit}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-slate-600 dark:text-slate-400">
                              {product.quantitySold}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              Rs.{" "}
                              {product.revenue.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </TableCell>
                            <TableCell className="text-right text-rose-600 dark:text-rose-400">
                              Rs.{" "}
                              {product.cost.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              Rs.{" "}
                              {product.profit.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={
                                  parseFloat(margin) > 20
                                    ? "success"
                                    : parseFloat(margin) > 10
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {margin}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </Card>
          )}

          {/* Sales by Customer Tab */}
          {activeTab === "sales-by-customer" && (
            <Card padding="none">
              {loadingTab ? (
                <div className="h-32 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Sales Performance by Customer
                    </h2>
                  </div>
                  <Table scrollable>
                    <TableHeader sticky>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                    </TableHeader>
                    <TableBody>
                      {salesByCustomer.map((customer) => (
                        <TableRow key={customer.customerId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {customer.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {customer.customerName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {customer.customerPhone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rs.{" "}
                            {customer.totalSales.toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                            Rs.{" "}
                            {customer.totalPaid.toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                customer.totalDue > 0
                                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                                  : "text-slate-600 dark:text-slate-400"
                              }
                            >
                              Rs.{" "}
                              {customer.totalDue.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setSelectedCustomer(customer);
                                fetchCustomerOrders(customer.customerId);
                              }}
                              className="inline-flex cursor-pointer hover:opacity-80 focus:outline-none"
                            >
                              <Badge>{customer.salesCount}</Badge>
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Card>
          )}

          {/* Purchase by Vendor Tab */}
          {activeTab === "purchase-by-vendor" && (
            <Card padding="none">
              {loadingTab ? (
                <div className="h-32 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Purchase Analysis by Vendor
                    </h2>
                  </div>
                  <Table scrollable>
                    <TableHeader sticky>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">
                        Total Purchases
                      </TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                    </TableHeader>
                    <TableBody>
                      {purchaseByVendor.map((vendor) => (
                        <TableRow key={vendor.vendorId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                {vendor.vendorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {vendor.vendorName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {vendor.vendorPhone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rs.{" "}
                            {vendor.totalPurchases.toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                            Rs.{" "}
                            {vendor.totalPaid.toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                vendor.totalDue > 0
                                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                                  : "text-slate-600 dark:text-slate-400"
                              }
                            >
                              Rs.{" "}
                              {vendor.totalDue.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setSelectedVendor(vendor);
                                fetchVendorPurchases(vendor.vendorId);
                              }}
                              className="inline-flex cursor-pointer hover:opacity-80 focus:outline-none"
                            >
                              <Badge>{vendor.purchaseCount}</Badge>
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </Card>
          )}

          {/* ✅ NEW: Walk-in Sales Tab */}
          {activeTab === "walk-in-sales" && (
            <div className="space-y-6">
              {loadingTab ? (
                <Card>
                  <div className="h-32 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </Card>
              ) : walkInSales ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total Walk-in Sales
                          </p>
                          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                            {walkInSales.summary.salesCount}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </Card>

                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Total Revenue
                          </p>
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                            Rs.{" "}
                            {walkInSales.summary.totalSales.toLocaleString(
                              "en-PK",
                              { minimumFractionDigits: 1 }
                            )}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <ArrowUpRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>
                    </Card>

                    <Card hover gradient>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Average Sale
                          </p>
                          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
                            Rs.{" "}
                            {(walkInSales.summary.salesCount > 0
                              ? walkInSales.summary.totalSales /
                                walkInSales.summary.salesCount
                              : 0
                            ).toLocaleString("en-PK", {
                              minimumFractionDigits: 1,
                            })}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Sales Table */}
                  <Card padding="none">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Walk-in Sales Details
                      </h2>
                    </div>
                    <Table scrollable>
                      <TableHeader sticky>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableHeader>
                      <TableBody>
                        {walkInSales.sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {sale.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="info" size="sm">
                                  Walk-in
                                </Badge>
                                {sale.walkInCustomerName}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(sale.saleDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              Rs.{" "}
                              {sale.totalAmount.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </TableCell>
                            <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                              Rs.{" "}
                              {sale.paidAmount.toLocaleString("en-PK", {
                                minimumFractionDigits: 1,
                              })}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/sales/${sale.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : null}
            </div>
          )}

          {/* ✅ NEW: Sales Comparison Tab */}
          {activeTab === "sales-comparison" && (
            <div className="space-y-6">
              {loadingTab ? (
                <Card>
                  <div className="h-32 flex items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </Card>
              ) : salesComparison ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Walk-in Stats */}
                  <Card>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Walk-in Sales
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Sales
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {salesComparison.walkIn.count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Revenue
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Rs.{" "}
                          {salesComparison.walkIn.total.toLocaleString(
                            "en-PK",
                            { minimumFractionDigits: 1 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          Average Sale
                        </span>
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                          Rs.{" "}
                          {salesComparison.walkIn.average.toLocaleString(
                            "en-PK",
                            { minimumFractionDigits: 1 }
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Registered Stats */}
                  <Card>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Registered Customers
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Sales
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {salesComparison.registered.count}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Revenue
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Rs.{" "}
                          {salesComparison.registered.total.toLocaleString(
                            "en-PK",
                            { minimumFractionDigits: 1 }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-slate-600 dark:text-slate-400">
                          Average Sale
                        </span>
                        <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                          Rs.{" "}
                          {salesComparison.registered.average.toLocaleString(
                            "en-PK",
                            { minimumFractionDigits: 1 }
                          )}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">
                Orders – {selectedCustomer.customerName}
              </h2>
              <Button
                variant="outline"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {loadingDetails ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => router.push(`/sales/${order.id}`)}
                      >
                        <TableCell>{order.invoiceNumber}</TableCell>
                        <TableCell>
                          {new Date(order.saleDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs. {order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs. {order.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          Rs. {order.dueAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vendor Purchases Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">
                Purchases – {selectedVendor.vendorName}
              </h2>
              <Button variant="outline" onClick={() => setSelectedVendor(null)}>
                Close
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {loadingDetails ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableHeader>
                  <TableBody>
                    {vendorPurchases.map((purchase) => (
                      <TableRow
                        key={purchase.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() =>
                          router.push(`/purchases/${purchase.id}`)
                        }
                      >
                        <TableCell>{purchase.invoiceNumber}</TableCell>
                        <TableCell>
                          {new Date(
                            purchase.purchaseDate
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs. {purchase.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          Rs. {purchase.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          Rs. {purchase.dueAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}


