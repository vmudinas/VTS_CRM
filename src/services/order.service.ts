/**
 * Order Service
 * Handles order-related API operations
 */

import apiService from './api.service';

// Order status type
export type OrderStatus = 
  'pending' | 
  'completed' | 
  'cancelled' | 
  'WaitingForBitcoinPayment' | 
  'BitcoinPaid' | 
  'underpaid' | 
  'overpaid' | 
  'WaitingForPayPal' |
  'PayPalPaid' |
  'WaitingForZelle' |
  'ZellePaid' |
  'ApplePayPaid';

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
  async getOrder(id: number): Promise<Order> {
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

  /**
   * Generates a Bitcoin payment address for an order.
   * @param id Order ID
   * @returns Promise with the Bitcoin address and amount.
   */
  async generateBitcoinPayment(id: number): Promise<{ bitcoinAddress: string; bitcoinAmount: number }> {
    return apiService.post<{ bitcoinAddress: string; bitcoinAmount: number }>(`/orders/${id}/generate-bitcoin-payment`, {});
  }

  /**
   * Processes a PayPal payment for an order
   * @param id Order ID
   * @param paypalDetails PayPal transaction details
   * @returns Promise with the result of the PayPal payment process
   */
  async processPayPalPayment(id: number, paypalDetails: any): Promise<{ success: boolean; transactionId?: string }> {
    return apiService.post<{ success: boolean; transactionId?: string }>(`/orders/${id}/process-paypal-payment`, paypalDetails);
  }

  /**
   * Records a Zelle payment for manual verification
   * @param id Order ID
   * @param referenceNumber Zelle reference number provided by the customer
   * @returns Promise with the result of recording the payment
   */
  async recordZellePayment(id: number, referenceNumber: string): Promise<{ success: boolean; message: string }> {
    return apiService.post<{ success: boolean; message: string }>(`/orders/${id}/record-zelle-payment`, { referenceNumber });
  }

  /**
   * Processes an Apple Pay payment for an order
   * @param id Order ID
   * @param applePayDetails Apple Pay transaction details
   * @returns Promise with the result of the Apple Pay payment process
   */
  async processApplePayment(id: number, applePayDetails: any): Promise<{ success: boolean; transactionId?: string }> {
    return apiService.post<{ success: boolean; transactionId?: string }>(`/orders/${id}/process-apple-pay`, applePayDetails);
  }
}

// Create and export a singleton instance
const orderService = new OrderService();
export default orderService;
