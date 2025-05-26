import React, { createContext, useState, useContext, ReactNode } from 'react';
import PaymentService from '../services/payment.service';

// Define payment method types
export type PaymentMethodType = 'standard' | 'bitcoin' | 'applePay' | 'paypal' | 'zelle' | 'crypto';

// Define payment status types
export type PaymentStatusType = 
  'idle' | 
  'submitting' | 
  'success' | 
  'error' | 
  'waitingForBitcoin' | 
  'bitcoinPaid' |
  'waitingForPayPal' |
  'paypalComplete' |
  'waitingForZelle' |
  'zelleComplete' |
  'processingApplePay' |
  'applePayComplete';

// Define the context state interface
interface PaymentContextState {
  paymentMethod: PaymentMethodType;
  setPaymentMethod: (method: PaymentMethodType) => void;
  paymentStatus: PaymentStatusType;
  setPaymentStatus: (status: PaymentStatusType) => void;
  orderId: number | null;
  setOrderId: (id: number | null) => void;
  paymentError: string | null;
  setPaymentError: (error: string | null) => void;
  paymentDetails: Record<string, any>;
  setPaymentDetails: (details: Record<string, any>) => void;
  isProcessingPayment: boolean;
  trackPayment: (orderId: number, method: PaymentMethodType) => Promise<void>;
  confirmZellePayment: (orderId: number) => Promise<void>;
  recordPayment: (amount: number, method: PaymentMethodType, description?: string, orderId?: number) => Promise<number | null>;
}

// Create the context with default values
const PaymentContext = createContext<PaymentContextState>({
  paymentMethod: 'standard',
  setPaymentMethod: () => {},
  paymentStatus: 'idle',
  setPaymentStatus: () => {},
  orderId: null,
  setOrderId: () => {},
  paymentError: null,
  setPaymentError: () => {},
  paymentDetails: {},
  setPaymentDetails: () => {},
  isProcessingPayment: false,
  trackPayment: async () => {},
  confirmZellePayment: async () => {},
  recordPayment: async () => null
});

// Provider component
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('standard');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType>('idle');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({});
  const [paymentRecordId, setPaymentRecordId] = useState<number | null>(null);

  // Computed property to check if payment is being processed
  const isProcessingPayment = [
    'submitting',
    'waitingForBitcoin',
    'waitingForPayPal',
    'waitingForZelle',
    'processingApplePay'
  ].includes(paymentStatus);

  // Method to record payment in the database
  const recordPayment = async (amount: number, method: PaymentMethodType, description?: string, orderId?: number): Promise<number | null> => {
    try {
      // Get user details from localStorage if available
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      
      const paymentData = {
        paymentType: method,
        amount,
        description: description || `Payment via ${method}`,
        orderId: orderId || undefined,
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        status: 'pending'
      };
      
      const response = await PaymentService.recordPayment(paymentData);
      setPaymentRecordId(response.id || null);
      return response.id || null;
    } catch (error) {
      console.error('Error recording payment:', error);
      setPaymentError('Failed to record payment');
      return null;
    }
  };

  // Method to track payment status
  const trackPayment = async (orderId: number, method: PaymentMethodType) => {
    // Implementation will depend on the payment method
    // This is a placeholder for the actual implementation
    setOrderId(orderId);
    
    // Record the payment in the database
    const amount = paymentDetails.amount || 0;
    const description = `Order #${orderId} payment`;
    await recordPayment(amount, method, description, orderId);
    
    switch (method) {
      case 'bitcoin':
      case 'crypto':
        setPaymentStatus('waitingForBitcoin');
        break;
      case 'paypal':
        setPaymentStatus('waitingForPayPal');
        break;
      case 'zelle':
        setPaymentStatus('waitingForZelle');
        break;
      case 'applePay':
        setPaymentStatus('processingApplePay');
        break;
      default:
        setPaymentStatus('success');
    }
  };

  // Method to confirm Zelle payment manually
  const confirmZellePayment = async (orderId: number) => {
    try {
      if (paymentRecordId) {
        // Update payment status in the database
        await PaymentService.updatePaymentStatus(paymentRecordId, 'completed');
      }
      
      setPaymentStatus('zelleComplete');
      return Promise.resolve();
    } catch (error) {
      setPaymentError('Failed to confirm Zelle payment');
      setPaymentStatus('error');
      return Promise.reject(error);
    }
  };

  const value = {
    paymentMethod,
    setPaymentMethod,
    paymentStatus,
    setPaymentStatus,
    orderId,
    setOrderId,
    paymentError,
    setPaymentError,
    paymentDetails,
    setPaymentDetails,
    isProcessingPayment,
    trackPayment,
    confirmZellePayment,
    recordPayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use the payment context
export const usePayment = () => useContext(PaymentContext);

export default PaymentContext;