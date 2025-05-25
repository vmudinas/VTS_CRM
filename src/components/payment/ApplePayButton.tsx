import React from 'react';
import { useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { PaymentRequest } from '@stripe/stripe-js';

interface ApplePayButtonProps {
  amount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({ amount, onSuccess, onError, disabled = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = React.useState<PaymentRequest | null>(null);

  React.useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    // Create a PaymentRequest object with the required fields
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Order Total',
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check if the Payment Request API is available on this browser/device
    pr.canMakePayment().then(result => {
      if (result && result.applePay) {
        setPaymentRequest(pr);
      } else {
        console.log('Apple Pay is not available on this device');
      }
    });

    // Add event listener for payment success
    pr.on('paymentmethod', async (event) => {
      try {
        // Here you would normally confirm the payment with your backend
        // and handle the payment confirmation with Stripe

        // For this demo, we'll simulate a successful payment
        event.complete('success');
        onSuccess(event.paymentMethod);
      } catch (error) {
        event.complete('fail');
        onError(error as Error);
      }
    });
  }, [stripe, elements, amount, onSuccess, onError]);

  if (!paymentRequest) {
    return <div className="text-gray-500 text-sm">Apple Pay is not available on this device</div>;
  }

  return (
    <div className={`apple-pay-button ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark'
            },
          },
        }}
      />
    </div>
  );
};

export default ApplePayButton;