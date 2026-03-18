import { z } from 'zod';

export const OrderSchema = z.object({
  tenantId: z.string().uuid(),
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  customerMobile: z.string().regex(/^[0-9+]{10,15}$/, "Invalid mobile number"),
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
    image_url: z.string().optional(),
    customizations: z.array(z.any()).optional()
  })).min(1, "Order must have at least one item"),
  totalAmount: z.number().positive()
});

export const MenuItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Name is too short").max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  veg_or_nonveg: z.enum(['veg', 'nonveg', 'egg']).default('veg'),
  category_id: z.string().uuid().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  availability_status: z.boolean().default(true),
  prep_time_minutes: z.number().int().min(1).max(120).default(10)
});

export const TenantSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  slug: z.string().min(3, "Slug must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only"),
  owner_id: z.string().uuid().optional()
});

export const ProfileSchema = z.object({
    full_name: z.string().min(2).max(100).optional(),
    phone_number: z.string().regex(/^[0-9+]{10,15}$/, "Invalid phone number")
});
