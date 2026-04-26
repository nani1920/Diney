 
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
  category?: Category;
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

export type StaffRole = 'admin' | 'manager' | 'waiter' | 'chef';

export type StaffMember = {
    id: string;
    tenant_id: string;
    name: string;
    waiter_id: string;
    role: StaffRole;
    assigned_tables?: string[];
    status: 'active' | 'inactive';
    created_at: string;
};

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
  order_type?: 'TAKEAWAY' | 'DINE_IN';
  table_number?: string | null;
  session_id?: string | null;
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
export type TableOccupancyStatus = 'available' | 'occupied' | 'dirty';
export type TableAlertStatus = 'none' | 'service' | 'bill';

export type Table = {
    id: string;
    tenant_id: string;
    table_number: string;
    occupancy_status: TableOccupancyStatus;
    alert_status: TableAlertStatus;
    active_session_id?: string | null;
    assigned_staff_id?: string | null;
    handled_by_staff_id?: string | null;
    last_alert_at?: string | null;
    ready_orders_count?: number;
    capacity?: number;
    zone_name?: string;
    customer_name?: string | null;
};
