'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  UserCircle,
  ShoppingCart,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { ToastContainer } from '@/components/ui';

interface User {
  name: string;
  role: string;
  avatar?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  // Fetch user session and low stock count
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        // Fetch current user session
        const sessionResponse = await fetch('/api/auth/verify-session', { credentials: 'include' });
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setUser({
            name: sessionData.user.name,
            role: 'Administrator', // You can customize this based on actual role
            avatar: undefined,
          });
        }

        // Fetch low stock count
        const productsResponse = await fetch('/api/products', { credentials: 'include' });
        if (productsResponse.ok) {
          const products = await productsResponse.json();
          const lowStock = products.filter((p: any) => 
            p.stockQuantity < p.minimumStockLevel && p.isActive
          ).length;
          setLowStockCount(lowStock);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchUserAndData();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package, badge: lowStockCount },
    { name: 'Vendors', href: '/vendors', icon: Users },
    { name: 'Customers', href: '/customers', icon: UserCircle },
    { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
    { name: 'Sales', href: '/sales', icon: ShoppingBag },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <ToastContainer />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        user={user || undefined}
        onLogout={handleLogout}
      />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
        <main className="pt-16 px-6 py-8 mt-4 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

