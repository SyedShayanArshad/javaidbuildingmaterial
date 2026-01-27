'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Package, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important for cookie
        body: JSON.stringify(formData),
      });

      console.log('Login response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      // ✅ Redirect to dashboard after successful login
      const data = await response.json();
      console.log('Login response data:', data);
      console.log('Redirecting to:', data.redirectUrl || '/dashboard');
      
      // Add a small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(data.redirectUrl || '/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500 rounded-full opacity-5 blur-3xl animate-pulse dark:opacity-10"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-slate-500 rounded-full opacity-5 blur-3xl animate-pulse delay-1000 dark:opacity-10"></div>
      </div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block text-slate-900 dark:text-white">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/30">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Javaid Building Material</h1>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm">Inventory Management System</p>
                  </div>
                </div>
                <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
                  Complete inventory and sales management system for construction building materials.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg shadow-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-900 dark:text-white">Real-time Analytics</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Track sales, purchases, and inventory in real-time</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg shadow-sm">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-900 dark:text-white">Customer Management</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Manage vendors and customers with ease</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg shadow-sm">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-900 dark:text-white">Order Processing</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Efficient purchase and sales order management</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 lg:p-10 border border-slate-200 dark:border-slate-700">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl mb-4 shadow-lg shadow-emerald-900/30">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Sign in to access your dashboard
                </p>
              </div>

              {error && (
                <div className="mb-6">
                  <Alert variant="danger" onClose={() => setError('')}>
                    {error}
                  </Alert>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@inventory.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  icon={<Lock className="w-5 h-5" />}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  size="lg"
                >
                  Sign In
                </Button>
              </form>

            </div>

            <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
              Javaid Building Material Shop © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
