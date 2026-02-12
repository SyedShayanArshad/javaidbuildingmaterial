'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, AlertTriangle, Package as PackageIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ActionMenu, MenuItem } from '@/components/ui/ActionMenu';
import { ConfirmModal, useToast } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  minimumStockLevel: number;
  isActive: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock'>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null }>({ isOpen: false, productId: null });
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', { credentials: 'include' });
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteModal({ isOpen: true, productId: id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.productId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${deleteModal.productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== deleteModal.productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, productId: null });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.unit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'low-stock' &&
        product.stockQuantity < product.minimumStockLevel);

    return matchesSearch && matchesFilter && product.isActive;
  });

  const lowStockCount = products.filter(p => 
    p.stockQuantity < p.minimumStockLevel && p.isActive
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading products..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your inventory items and track stock levels"
        actions={
          <>
            <Link href="/products/adjust-stock">
              <Button variant="outline">
                Adjust Stock
              </Button>
            </Link>
            <Link href="/products/new">
              <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                Add Product
              </Button>
            </Link>
          </>
        }
      />

      {/* Filters Card */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search products by name or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
          <div className="flex gap-2">
            <FilterTabs
              tabs={[
                { label: 'All Products', value: 'all', count: products.filter(p => p.isActive).length },
                { label: 'Low Stock', value: 'low-stock', count: lowStockCount },
              ]}
              activeTab={filter}
              onChange={(value) => setFilter(value as 'all' | 'low-stock')}
            />
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card padding="none">
        <Table scrollable>
          <TableHeader sticky>
            <TableHead>Product Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Stock Quantity</TableHead>
            <TableHead>Min. Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const isLowStock = product.stockQuantity < product.minimumStockLevel;
              const menuItems: MenuItem[] = [
                {
                  label: 'Edit Product',
                  icon: Edit,
                  onClick: () => window.location.href = `/products/${product.id}`,
                },
                {
                  label: 'Delete Product',
                  icon: Trash2,
                  onClick: () => handleDeleteClick(product.id),
                  variant: 'danger',
                },
              ];

              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <PackageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-400">{product.unit}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      product.stockQuantity < 0 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : isLowStock 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {Number(product.stockQuantity).toFixed(3)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-400">{Number(product.minimumStockLevel).toFixed(3)}</span>
                  </TableCell>
                  <TableCell>
                    {product.stockQuantity < 0 ? (
                      <Badge variant="warning" icon={<AlertTriangle className="w-3 h-3" />}>
                        Negative Stock
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/products/${product.id}`}>
                        <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredProducts.length === 0 && (
          <EmptyState
            icon={<PackageIcon className="w-16 h-16" />}
            title="No products found"
            description={searchTerm ? "Try adjusting your search terms" : "Get started by adding your first product"}
            action={
              !searchTerm && (
                <Link href="/products/new">
                  <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                    Add Product
                  </Button>
                </Link>
              )
            }
          />
        )}
      </Card>

      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <p>
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{products.filter(p => p.isActive).length}</span> products
          </p>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />    </div>
  );
}

