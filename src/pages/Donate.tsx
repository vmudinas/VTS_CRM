import React, { useState } from 'react';
import { usePayment, PaymentMethodType } from '../context/PaymentContext';
import PaymentService from '../services/payment.service';
import {
  PayPalButton,
  ZelleInstructions,
  CryptoPayment,
  PaymentStatusBadge
} from '../components/payment';

const Donate: React.FC = () => {
  const [amount, setAmount] = useState<number>(5);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('paypal');
  const [donationId] = useState<number>(Math.floor(Math.random() * 1000000)); // Mock donation ID
  const [cryptoAddress] = useState<string>("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"); // Example Bitcoin address
  
  const {
    setPaymentMethod,
    paymentStatus,
    setPaymentStatus,
    isProcessingPayment,
    confirmZellePayment,
    recordPayment
  } = usePayment();

  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setSelectedMethod(method);
    setPaymentMethod(method);
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would process the donation with the selected method
    console.log(`Processing ${amount} donation with ${selectedMethod} method`);
  };

  const handlePaymentSuccess = async (paymentDetails: any) => {
    console.log('Payment successful:', paymentDetails);
    
    // Record the successful payment
    const paymentId = await recordPayment(
      amount, 
      selectedMethod, 
      'Donation', 
      undefined
    );
    
    if (paymentId && selectedMethod !== 'zelle') {
      // Update payment status for methods that complete immediately
      await PaymentService.updatePaymentStatus(paymentId, 'completed');
    }
    
    setPaymentStatus('success');
    // Show success message or redirect
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error);
    setPaymentStatus('error');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Make a Donation</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleDonateSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
              Donation Amount ($)
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                type="button"
                className={`p-4 border rounded-md flex flex-col items-center ${selectedMethod === 'paypal' ? 'bg-blue-100 border-blue-500' : ''}`}
                onClick={() => handlePaymentMethodChange('paypal')}
              >
                <svg className="w-12 h-12 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5 9.5C17.5 13.09 14.59 16 11 16H6L3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 5.5C21 9.09 18.09 12 14.5 12H9.5L6.5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14.5 3C18.09 3 21 5.91 21 9.5C21 13.09 18.09 16 14.5 16H9.5L6.5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                PayPal
              </button>
              <button 
                type="button"
                className={`p-4 border rounded-md flex flex-col items-center ${selectedMethod === 'zelle' ? 'bg-blue-100 border-blue-500' : ''}`}
                onClick={() => handlePaymentMethodChange('zelle')}
              >
                <svg className="w-12 h-12 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L12 15L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 21H5C5 19.3431 6.34315 18 8 18H16C17.6569 18 19 19.3431 19 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Zelle
              </button>
              <button 
                type="button"
                className={`p-4 border rounded-md flex flex-col items-center ${selectedMethod === 'crypto' ? 'bg-blue-100 border-blue-500' : ''}`}
                onClick={() => handlePaymentMethodChange('crypto')}
              >
                <svg className="w-12 h-12 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Cryptocurrency
              </button>
            </div>
          </div>
          
          {/* Payment Status */}
          {paymentStatus !== 'idle' && (
            <div className="mb-4">
              <PaymentStatusBadge status={paymentStatus} />
            </div>
          )}
          
          {/* Payment Method Specific Components */}
          <div className="mb-6">
            {selectedMethod === 'paypal' && (
              <div className="my-4">
                <PayPalButton 
                  amount={amount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            )}
            
            {selectedMethod === 'zelle' && (
              <div className="my-4">
                <ZelleInstructions 
                  amount={amount}
                  orderId={donationId}
                  onConfirmPayment={async () => {
                    await confirmZellePayment(donationId);
                    handlePaymentSuccess({ status: 'completed', id: donationId });
                  }}
                />
              </div>
            )}
            
            {selectedMethod === 'crypto' && (
              <div className="my-4">
                <CryptoPayment 
                  amount={0.0001} // Example amount in Bitcoin
                  address={cryptoAddress}
                  cryptoType="bitcoin"
                  isWaiting={true}
                  orderId={donationId}
                />
              </div>
            )}
          </div>
          
          {/* Submit Button - only show for payment methods that need it */}
          {['standard'].includes(selectedMethod) && (
            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isProcessingPayment ? 'Processing...' : `Donate $${amount}`}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Donate;