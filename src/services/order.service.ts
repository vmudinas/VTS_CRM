/**
 * Order Service
 * Handles order-related API operations
 */

import apiService from './api.service';

// Order status type
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// Order item interface
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

// Order interface
export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  lastUpdatedBy?: string;
  items?: OrderItem[];
}

/**
 * Order Service class for handling order-related API operations
 */
class OrderService {
  /**
   * Get all orders
   * @returns Promise with array of orders
   */
  async getAllOrders(): Promise<Order[]> {
    return apiService.get<Order[]>('/orders');
  }

  /**
   * Get an order by ID
   * @param id Order ID
   * @returns Promise with the order
   */
  async getOrderById(id: number): Promise<Order> {
    return apiService.get<Order>(`/orders/${id}`);
  }

  /**
   * Create a new order
   * @param orderData Order data
   * @returns Promise with the created order
   */
  async createOrder(orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    items: { productId: number; quantity: number }[];
  }): Promise<{ id: number; message: string }> {
    return apiService.post<{ id: number; message: string }>('/orders', orderData);
  }

  /**
   * Update order status
   * @param id Order ID
   * @param status New status
   * @returns Promise with the update result
   */
  async updateOrderStatus(id: number, status: OrderStatus): Promise<{ message: string }> {
    return apiService.put<{ message: string }>(`/orders/${id}/status`, { status });
  }
}

// Create and export a singleton instance
const orderService = new OrderService();
export default orderService;
