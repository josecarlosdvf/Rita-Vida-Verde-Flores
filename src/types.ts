export enum SessionPolicy {
  KILL_OLD = 'kill_old',
  BLOCK_NEW = 'block_new'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum SystemStatus {
  ONLINE = 'online',
  MAINTENANCE = 'maintenance'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  slug: string;
  rating?: number;
  reviewsCount?: number;
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  approved: boolean;
  replied?: boolean;
  reply?: string;
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  order: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: any;
}

export interface Settings {
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  googleMapsEmbed?: string;
  whatsappNumber: string;
  status: SystemStatus;
  maintenanceMessage?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  timestamp: any;
  operationType: 'create' | 'update' | 'delete';
  entityName: string;
  oldData?: any;
  newData?: any;
}

export interface UserProfile {
  uid: string;
  login: string;
  name: string;
  companyName: string;
  status: UserStatus;
  maxSessions: number;
  sessionPolicy: SessionPolicy;
  createdAt: any;
}
