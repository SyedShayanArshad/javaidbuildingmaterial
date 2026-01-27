import { z } from 'zod';

// ========================================
// USER VALIDATION
// ========================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// ========================================
// PRODUCT VALIDATION
// ========================================

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  unit: z.enum(['BAG', 'KG', 'TON', 'PIECE', 'METER', 'SQFT', 'CUFT']),
  minimumStockLevel: z.coerce
    .number()
    .min(0, 'Minimum stock level must be 0 or greater')
    .default(0),
});

// ========================================
// VENDOR VALIDATION
// ========================================

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// ========================================
// CUSTOMER VALIDATION
// ========================================

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),

});

// ========================================
// PURCHASE VALIDATION
// ========================================

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
});

export const purchaseSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  purchaseDate: z.coerce.date(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative').default(0),
  notes: z.string().optional(),
});

// ========================================
// SALE VALIDATION
// ========================================

export const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().positive('Unit price must be greater than 0'),
});

export const saleSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  saleDate: z.coerce.date(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative').default(0),
  notes: z.string().optional(),
});

// ========================================
// PAYMENT VALIDATION
// ========================================

export const paymentSchema = z.object({
  partyType: z.enum(['VENDOR', 'CUSTOMER']),
  partyId: z.string().min(1, 'Party is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentMode: z.enum(['CASH', 'BANK', 'ONLINE']),
  referenceNumber: z.string().optional(),
  paymentDate: z.coerce.date(),
  notes: z.string().optional(),
});

// ========================================
// STOCK ADJUSTMENT VALIDATION
// ========================================

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  movementType: z.enum(['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'OPENING_STOCK']),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
