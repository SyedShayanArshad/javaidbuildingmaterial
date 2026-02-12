'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Users,
  UserCircle,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, PageHeader, LoadingSpinner, Badge } from '@/components/ui';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  negativeStockProducts: number;
  totalVendors: number;
  totalCustomers: number;
  vendorBalance: number;
  customerBalance: number;
  todaySales: number;
  todayPurchases: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to Javaid Building Material Shop - Track your inventory and business operations."
      />

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/products" className="block">
          <Card hover gradient className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Products</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalProducts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/stock" className="block">
          <Card hover gradient className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{stats?.lowStockProducts || 0}</p>
                {(stats?.negativeStockProducts || 0) > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {stats?.negativeStockProducts} negative stock
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/vendors" className="block">
          <Card hover gradient className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Vendors</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalVendors || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/customers" className="block">
          <Card hover gradient className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Customers</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stats?.totalCustomers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Financial Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Financial Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card hover gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <Badge variant="danger">Payable</Badge>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Accounts Payable</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Rs. {(stats?.vendorBalance || 0).toLocaleString('en-PK', { minimumFractionDigits: 1 })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Amount owed to vendors</p>
          </Card>

          <Card hover gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <Badge variant="success">Receivable</Badge>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Accounts Receivable</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Rs. {(stats?.customerBalance || 0).toLocaleString('en-PK', { minimumFractionDigits: 1 })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Amount owed by customers</p>
          </Card>

          <Card hover gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <Badge variant="info">Today</Badge>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Today's Sales</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Rs. {(stats?.todaySales || 0).toLocaleString('en-PK', { minimumFractionDigits: 1 })}
            </p>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>Revenue generated today</span>
            </div>
          </Card>

          <Card hover gradient>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <Badge variant="warning">Today</Badge>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Today's Purchases</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Rs. {(stats?.todayPurchases || 0).toLocaleString('en-PK', { minimumFractionDigits: 1 })}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <DollarSign className="w-3 h-3" />
              <span>Purchases made today</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/purchases/new" className="block">
            <Card hover gradient className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">New Purchase</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Create a new purchase order from vendors</p>
              </div>
            </Card>
          </Link>

          <Link href="/sales/new" className="block">
            <Card hover gradient className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">New Sale</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Create a new sales invoice for customers</p>
              </div>
            </Card>
          </Link>

          <Link href="/products/new" className="block">
            <Card hover gradient className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Add Product</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Add new product to your inventory</p>
              </div>
            </Card>
          </Link>

          <Link href="/reports" className="block">
            <Card hover gradient className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">View Reports</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Analyze sales and inventory analytics</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}



