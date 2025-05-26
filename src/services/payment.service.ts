import axios from 'axios';

// Define the base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// PaymentRecord interface matching backend model
export interface PaymentRecord {
  id?: number;
  paymentType: string;
  amount: number;
  description?: string;
  orderId?: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  status?: string;
  ipAddress?: string;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentStatusUpdate {
  status: string;
}

/**
 * Payment service for handling payment records
 */
const PaymentService = {
  /**
   * Record a new payment
   * @param payment Payment details
   * @returns Promise with the created payment record
   */
  recordPayment: async (payment: Omit<PaymentRecord, 'id' | 'ipAddress' | 'processedAt' | 'createdAt' | 'updatedAt'>): Promise<PaymentRecord> => {
    try {
      const response = await axios.post(`${API_URL}/api/PaymentRecords`, payment);
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  /**
   * Update payment status
   * @param id Payment record ID
   * @param status Updated payment status
   * @returns Promise with updated payment record
   */
  updatePaymentStatus: async (id: number, status: string): Promise<PaymentRecord> => {
    try {
      const response = await axios.put(`${API_URL}/api/PaymentRecords/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  /**
   * Get payment record by ID
   * @param id Payment record ID
   * @returns Promise with payment record
   */
  getPaymentById: async (id: number): Promise<PaymentRecord> => {
    try {
      const response = await axios.get(`${API_URL}/api/PaymentRecords/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment record:', error);
      throw error;
    }
  }
};

export default PaymentService;