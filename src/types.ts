import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Role = 'admin' | 'front_desk' | 'restaurant' | 'kitchen';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'Executive Plus' | 'Executive' | 'Standard';
  price: number;
  description: string;
  images: string[];
  features: string[];
  isAvailable: boolean;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'checked_out';
  createdAt: string;
  room?: Room;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Drinks';
  isAvailable: boolean;
  imageUrl?: string;
}

export interface Order {
  id: string;
  roomId?: string;
  tableNumber?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  priceAtTime: number;
  menuItem?: MenuItem;
}

export interface Content {
  key: string;
  value: any;
}
