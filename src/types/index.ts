// Customization options for items
export type Customization = {
  type: 'addon' | 'spice_level' | 'special_instruction';
  name: string;
  price?: number; // For add-ons
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  veg_or_nonveg: 'veg' | 'non-veg';
  availability_status: boolean;
  prep_time_minutes: number; // Estimated preparation time
};

export type CartItem = MenuItem & {
  quantity: number;
  customizations?: Customization[]; // Optional customizations
};

export type PromoCode = {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  is_active: boolean;
};

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type Order = {
  order_id: string;
  customer_name: string;
  customer_mobile: string;
  order_note?: string;
  items: CartItem[];
  total_amount: number;
  discount_amount?: number; // Discount applied
  applied_promo_code?: string; // Promo code used
  estimated_ready_time?: string; // ISO string
  order_status: OrderStatus;
  order_time: string; // ISO string
};

export type Customer = {
  customer_id: string;
  name: string;
  mobile: string;
  total_spent: number;
  last_order_date: string;
};
