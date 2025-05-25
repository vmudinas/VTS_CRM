import React from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer
} from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (paymentDetails: any) => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}

// PayPal client ID - in a real app, this should be in .env file
const PAYPAL_CLIENT_ID = 'test';

const ButtonWrapper: React.FC<PayPalButtonProps> = ({ amount, onSuccess, onError, disabled }) => {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <>
      {isPending ? (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
          <span className="ml-2 text-gray-600">Loading PayPal...</span>
        </div>
      ) : (
        <PayPalButtons
          disabled={disabled}
          forceReRender={[amount]}
          fundingSource="paypal"
          style={{
            layout: 'horizontal',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
            height: 40
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            try {
              if (actions.order) {
                const details = await actions.order.capture();
                onSuccess(details);
                return details;
              }
              throw new Error('Failed to capture order');
            } catch (error) {
              onError(error as Error);
              throw error;
            }
          }}
          onError={(err) => {
            console.error('PayPal error:', err);
            onError(err as Error);
          }}
        />
      )}
    </>
  );
};

const PayPalButton: React.FC<PayPalButtonProps> = (props) => {
  return (
    <div className="paypal-button-container">
      <PayPalScriptProvider
        options={{
          'client-id': PAYPAL_CLIENT_ID,
          currency: 'USD',
          intent: 'capture',
        }}
      >
        <ButtonWrapper {...props} />
      </PayPalScriptProvider>
    </div>
  );
};

export default PayPalButton;