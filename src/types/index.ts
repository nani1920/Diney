 
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

export type ServerActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export type CartItem = MenuItem & {
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

export type Order = {
  order_id: string;
  short_id: string;
  customer_name: string;
  customer_mobile: string;
  order_note?: string;
  items: CartItem[];
  total_amount: number;
  discount_amount?: number;  
  applied_promo_code?: string;  
  estimated_ready_time?: string;  
  order_status: OrderStatus;
  order_time: string;  
};

export type Customer = {
  customer_id: string;
  name: string;
  mobile: string;
  total_spent: number;
  last_order_date: string;
};
