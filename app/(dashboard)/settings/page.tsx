'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormGroup } from '@/components/ui/FormGroup';
import { Alert } from '@/components/ui/Alert';
import { User, Lock, Mail, Calendar, Shield, Package, ToggleLeft, ToggleRight } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();
  useEffect(() => {
    fetch('/api/auth/verify-session', {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
      })
      .catch(() => {
        router.push('/login');
      });

    // Fetch system settings
    fetch('/api/settings', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('failed');
        return res.json();
      })
      .then(data => {
        setAllowNegativeStock(data.allowNegativeStock || false);
      })
      .catch(() => {
        // Settings may not exist yet, default to false
      });
  }, [router]);


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSettingsMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNegativeStock = async () => {
    setSettingsLoading(true);
    setSettingsMessage(null);

    try {
      const newValue = !allowNegativeStock;
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ allowNegativeStock: newValue }),
      });

      if (response.ok) {
        setAllowNegativeStock(newValue);
        setSettingsMessage({
          type: 'success',
          text: newValue
            ? 'Negative stock enabled — Sales can now be made even when stock is 0 or below'
            : 'Negative stock disabled — Sales will require sufficient stock'
        });
      } else {
        const data = await response.json();
        setSettingsMessage({ type: 'error', text: data.error || 'Failed to update setting' });
      }
    } catch (error) {
      setSettingsMessage({ type: 'error', text: 'An error occurred while updating settings' });
    } finally {
      setSettingsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administrator"
        description="Manage your account information and security settings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Information</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Your profile details</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                  {user.name || 'N/A'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                  {user.email || 'N/A'}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                  {user.role || 'Retailer'}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Update your password to keep your account secure</p>
            </div>
          </div>

          {message && (
            <div className="mb-4">
              <Alert
                variant={message.type === 'success' ? 'success' : 'danger'}
                onClose={() => setMessage(null)}
              >
                {message.text}
              </Alert>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <FormGroup>
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </FormGroup>

            <FormGroup>
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                required
                minLength={6}
              />
            </FormGroup>

            <FormGroup>
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </FormGroup>

            <div className="pt-4">
              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                Change Password
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Password Requirements
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Use a mix of letters and numbers</li>
                  <li>• Avoid using personal information</li>
                  <li>• Change your password regularly</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Information</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          As a system administrator, you have full access to manage your inventory system. 
          Keep your credentials secure and change your password regularly to ensure the safety 
          of your business data.
        </p>
      </Card>

      {/* Inventory Settings Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inventory Settings</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Configure stock and inventory behavior</p>
          </div>
        </div>

        {settingsMessage && (
          <div className="mb-4">
            <Alert
              variant={settingsMessage.type === 'success' ? 'success' : 'danger'}
              onClose={() => setSettingsMessage(null)}
            >
              {settingsMessage.text}
            </Alert>
          </div>
        )}

        <div className="space-y-4">
          {/* Allow Negative Stock Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Allow Negative Stock</h3>
                {allowNegativeStock ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                When enabled, sales can be created even when product stock is 0 or below. The stock quantity 
                will go into negative, and will automatically recover when you add stock through purchases 
                or stock adjustments.
              </p>
              {allowNegativeStock && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Products with negative stock indicate pending stock that needs to be purchased from vendors.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleNegativeStock}
              disabled={settingsLoading}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                allowNegativeStock ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  allowNegativeStock ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

