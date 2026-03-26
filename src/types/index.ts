 
export type Customization = {
  type: 'addon' | 'spice_level' | 'special_instruction';
  name: string;
  price?: number;  
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  veg_or_nonveg: 'veg' | 'non-veg';
  availability_status: boolean;
  prep_time_minutes: number;
  image_url?: string;
  category_id?: string;
  master_product_id?: string;
};

export type ServerActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CartItem = MenuItem & {
  cart_id?: string; // Database primary key
  uniqueId: string; // UI unique identifier (menuItemId + customizations)
  quantity: number;
  customizations?: Customization[];  
};

export type PromoCode = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  is_active: boolean;
};

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderItem = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  customizations?: Customization[];
};

export type Order = {
  order_id: string;
  short_id: string;
  customer_name: string;
  customer_mobile: string;
  order_note?: string;
  items: OrderItem[];
  total_amount: number;
  discount_amount?: number;  
  applied_promo_code?: string;  
  estimated_ready_time?: string;  
  order_status: OrderStatus;
  order_time: string;  
  payment_status?: string;
  payment_id?: string;
};

export type Customer = {
  name: string;
  mobile: string;
  totalOrders: number;
  lastOrder: string;
};

export type Category = {
  id: string;
  name: string;
  display_order: number;
  tenant_id?: string;
};

export type TenantConfig = {
  isStoreOpen?: boolean;
  openingTime?: string;
  closingTime?: string;
  [key: string]: any;
};
