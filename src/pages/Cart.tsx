import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../App';
import { orderService } from '../services';
import PaymentService from '../services/payment.service';
import { QRCodeCanvas } from 'qrcode.react';
import { PaymentProvider, usePayment, PaymentMethodType, PaymentStatusType } from '../context/PaymentContext';
import { 
  ApplePayButton, 
  PayPalButton, 
  ZelleInstructions, 
  CryptoPayment, 
  PaymentStatusBadge, 
  StripeProvider 
} from '../components/payment';

interface CartProps {
  cartItems: Product[];
  setCartItems: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Cart: React.FC<CartProps> = ({ cartItems, setCartItems }) => {
  // Group cart items by product
  const grouped: Record<string, { product: Product; quantity: number }> = {};
  cartItems.forEach(item => {
    const key = item.id?.toString() || item.name;
    if (!grouped[key]) {
      grouped[key] = { product: item, quantity: 1 };
    } else {
      grouped[key].quantity += 1;
    }
  });
  const items = Object.values(grouped);
  const totalAmount = items.reduce(
    (sum, { product, quantity }) => sum + product.price * quantity,
    0
  );

  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('standard');
  const [status, setStatus] = useState<PaymentStatusType>('idle');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
  const [bitcoinAmount, setBitcoinAmount] = useState<number | null>(null);

  // Remove all instances of a product from cart
  const removeProduct = (product: Product) => {
    const key = product.id?.toString() || product.name;
    setCartItems(prev => prev.filter(item => (item.id?.toString() || item.name) !== key));
  };

  // Function to check order status (will be implemented in orderService)
  const checkOrderStatus = async (id: number) => {
      try {
          const order = await orderService.getOrder(id); // Need to implement getOrder in orderService
          if (order.status === 'BitcoinPaid') { // Assuming 'BitcoinPaid' is the status when confirmed
              setStatus('bitcoinPaid');
          } else if (order.status === 'underpaid') {
              setStatus('error'); // Or a specific 'underpaid' status
              setErrorMessage('Payment received was less than the required amount.');
          } else if (order.status === 'overpaid') {
               setStatus('bitcoinPaid'); // Or a specific 'overpaid' status
               // setErrorMessage('Payment received was more than the required amount.'); // Maybe not an error for the user
          }
          // Add other status checks as needed (e.g., 'cancelled')
      } catch (err: any) {
          console.error('Error checking order status:', err);
          // Handle error, maybe set status to 'error' after a few retries
      }
  };

  // Polling effect for Bitcoin payment status
  useEffect(() => {
      let intervalId: NodeJS.Timeout | null = null;
      if (status === 'waitingForBitcoin' && orderId !== null) {
          // Start polling every 10 seconds (adjust as needed)
          intervalId = setInterval(() => {
              checkOrderStatus(orderId);
          }, 10000);
      }

      // Cleanup function to clear the interval
      return () => {
          if (intervalId) {
              clearInterval(intervalId);
          }
      };
  }, [status, orderId]); // Re-run effect if status or orderId changes

  // Handle order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('Name and email are required');
      return;
    }
    setStatus('submitting');
    try {
      const orderItems = items.map(({ product, quantity }) => ({
        productId: product.id as number,
        quantity,
      }));

      const orderResponse = await orderService.createOrder({
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
        items: orderItems,
      });
      const createdOrderId = orderResponse.id;
      setOrderId(createdOrderId);

      switch (paymentMethod) {
        case 'bitcoin':
        case 'crypto':
          setStatus('waitingForBitcoin');
          try {
            const bitcoinPaymentDetails = await orderService.generateBitcoinPayment(createdOrderId);
            setBitcoinAddress(bitcoinPaymentDetails.bitcoinAddress);
            setBitcoinAmount(bitcoinPaymentDetails.bitcoinAmount);
            
            // Record the payment in the database
            await PaymentService.recordPayment({
              paymentType: paymentMethod,
              amount: totalAmount,
              description: `Order #${createdOrderId} payment`,
              orderId: createdOrderId,
              userName: customerName,
              userEmail: customerEmail,
              status: 'pending'
            });
            
            setCartItems([]); // Clear cart after order creation
          } catch (bitcoinErr: any) {
            console.error('Error generating Bitcoin payment:', bitcoinErr);
            setErrorMessage(bitcoinErr.message || 'Failed to generate Bitcoin payment details.');
            setStatus('error');
          }
          break;
          
        case 'paypal':
          // PayPal payment is handled by the PayPal button component
          // We'll just set the status and clear the cart
          setStatus('waitingForPayPal');
          
          // Record the payment in the database
          await PaymentService.recordPayment({
            paymentType: 'paypal',
            amount: totalAmount,
            description: `Order #${createdOrderId} payment via PayPal`,
            orderId: createdOrderId,
            userName: customerName,
            userEmail: customerEmail,
            status: 'pending'
          });
          
          setCartItems([]);
          break;
          
        case 'zelle':
          // Zelle payment requires manual confirmation
          setStatus('waitingForZelle');
          
          // Record the payment in the database
          await PaymentService.recordPayment({
            paymentType: 'zelle',
            amount: totalAmount,
            description: `Order #${createdOrderId} payment via Zelle`,
            orderId: createdOrderId,
            userName: customerName,
            userEmail: customerEmail,
            status: 'pending'
          });
          
          setCartItems([]);
          break;
          
        case 'applePay':
          // Apple Pay is processed on the client side
          setStatus('processingApplePay');
          
          // Record the payment in the database
          await PaymentService.recordPayment({
            paymentType: 'applePay',
            amount: totalAmount,
            description: `Order #${createdOrderId} payment via Apple Pay`,
            orderId: createdOrderId,
            userName: customerName,
            userEmail: customerEmail,
            status: 'pending'
          });
          
          setCartItems([]);
          break;
          
        default: // Standard payment
          // Record the payment in the database for standard payment
          await PaymentService.recordPayment({
            paymentType: 'standard',
            amount: totalAmount,
            description: `Order #${createdOrderId} standard payment`,
            orderId: createdOrderId,
            userName: customerName,
            userEmail: customerEmail,
            status: 'pending'
          });
          
          setStatus('success');
          setCartItems([]); // Clear cart after order creation
          break;
      }

    } catch (err: any) {
      console.error('Error placing order:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="animate-fade-in text-center py-12">
        <PaymentStatusBadge status={status} />
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-4">Your order ID is {orderId}</p>
        <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  if (status === 'bitcoinPaid') {
    return (
      <div className="animate-fade-in text-center py-12">
        <PaymentStatusBadge status={status} />
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Bitcoin Payment Confirmed!</h1>
        <p className="text-gray-600 mb-4">Your order ID is {orderId}. Your payment has been confirmed.</p>
        <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  if (status === 'paypalComplete') {
    return (
      <div className="animate-fade-in text-center py-12">
        <PaymentStatusBadge status={status} />
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">PayPal Payment Confirmed!</h1>
        <p className="text-gray-600 mb-4">Your order ID is {orderId}. Your payment has been processed successfully.</p>
        <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  if (status === 'zelleComplete') {
    return (
      <div className="animate-fade-in text-center py-12">
        <PaymentStatusBadge status={status} />
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Zelle Payment Confirmed!</h1>
        <p className="text-gray-600 mb-4">Your order ID is {orderId}. We have received your payment confirmation.</p>
        <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  if (status === 'applePayComplete') {
    return (
      <div className="animate-fade-in text-center py-12">
        <PaymentStatusBadge status={status} />
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Apple Pay Payment Confirmed!</h1>
        <p className="text-gray-600 mb-4">Your order ID is {orderId}. Your payment has been processed successfully.</p>
        <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  if (status === 'waitingForBitcoin') {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="max-w-lg mx-auto">
          <PaymentStatusBadge status={status} />
          <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Waiting for Cryptocurrency Payment</h1>
          <CryptoPayment 
            address={bitcoinAddress} 
            amount={bitcoinAmount} 
            cryptoType="bitcoin"
            isWaiting={true}
            orderId={orderId}
          />
          <Link to="/" className="text-primary-600 hover:underline mt-6 inline-block">Return to Home</Link>
        </div>
      </div>
    );
  }

  if (status === 'waitingForPayPal') {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="max-w-lg mx-auto">
          <PaymentStatusBadge status={status} />
          <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Complete PayPal Payment</h1>
          <p className="text-gray-600 mb-6">Your order ID is {orderId}. Please complete the PayPal payment below.</p>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <PayPalButton
              amount={totalAmount}
              onSuccess={async (details) => {
                try {
                  // Process PayPal payment on the server
                  await orderService.processPayPalPayment(orderId as number, details);
                  setStatus('paypalComplete');
                } catch (error) {
                  console.error('PayPal processing error:', error);
                  setErrorMessage('Failed to process PayPal payment. Please contact support.');
                  setStatus('error');
                }
              }}
              onError={(error) => {
                console.error('PayPal error:', error);
                setErrorMessage('PayPal payment error. Please try again or choose another payment method.');
                setStatus('error');
              }}
            />
          </div>
          <Link to="/" className="text-primary-600 hover:underline mt-6 inline-block">Return to Home</Link>
        </div>
      </div>
    );
  }

  if (status === 'waitingForZelle') {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="max-w-lg mx-auto">
          <PaymentStatusBadge status={status} />
          <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Complete Zelle Payment</h1>
          <ZelleInstructions
            amount={totalAmount}
            orderId={orderId}
            onConfirmPayment={async () => {
              try {
                // Record Zelle payment with reference number
                await orderService.recordZellePayment(orderId as number, 'manual-confirmation');
                setStatus('zelleComplete');
              } catch (error) {
                console.error('Zelle confirmation error:', error);
                setErrorMessage('Failed to confirm Zelle payment. Please contact support.');
                setStatus('error');
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (status === 'processingApplePay') {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="max-w-lg mx-auto">
          <PaymentStatusBadge status={status} />
          <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4 mt-2">Apple Pay Payment</h1>
          <p className="text-gray-600 mb-6">Finalizing your payment...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

    if (status === 'error') { // Display error message for general errors
        return (
            <div className="animate-fade-in text-center py-12">
                <PaymentStatusBadge status={status} />
                <h1 className="font-heading text-3xl font-bold text-red-600 mb-4 mt-2">Payment Error</h1>
                <p className="text-gray-600 mb-4">{errorMessage || 'An error occurred during the payment process.'}</p>
                <Link to="/" className="text-primary-600 hover:underline">Return to Home</Link>
            </div>
        );
    }

  return (
    <div className="animate-fade-in px-4 py-8 max-w-4xl mx-auto">
      <h1 className="font-heading text-4xl font-bold text-gray-800 text-center mb-8">Your Cart</h1>
      {cartItems.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id || product.name} className="flex items-center bg-white p-4 rounded-lg shadow">
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
                <div className="ml-4 flex-grow">
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-gray-600">${product.price.toFixed(2)} x {quantity}</p>
                </div>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => removeProduct(product)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 text-right">
            <p className="text-xl font-semibold">Total: ${totalAmount.toFixed(2)}</p>
          </div>
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-heading text-2xl font-semibold text-gray-800 mb-4">Checkout</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && <p className="text-red-500">{errorMessage}</p>}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={status === 'submitting'}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={status === 'submitting'}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={status === 'submitting'}
                />
              </div>
              {/* Payment Method Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Standard Payment */}
                  <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                       onClick={() => setPaymentMethod('standard')}>
                    <input
                      id="payment-standard"
                      name="payment-method"
                      type="radio"
                      value="standard"
                      checked={paymentMethod === 'standard'}
                      onChange={() => setPaymentMethod('standard')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      disabled={status === 'submitting'}
                    />
                    <label htmlFor="payment-standard" className="ml-3 block text-sm text-gray-900 flex items-center">
                      <span className="bg-gray-200 p-1 rounded-md mr-2">💳</span>
                      Standard Payment
                    </label>
                  </div>
                  
                  {/* Apple Pay */}
                  <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                       onClick={() => setPaymentMethod('applePay')}>
                    <input
                      id="payment-apple-pay"
                      name="payment-method"
                      type="radio"
                      value="applePay"
                      checked={paymentMethod === 'applePay'}
                      onChange={() => setPaymentMethod('applePay')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      disabled={status === 'submitting'}
                    />
                    <label htmlFor="payment-apple-pay" className="ml-3 block text-sm text-gray-900 flex items-center">
                      <span className="bg-black text-white p-1 rounded-md mr-2 text-xs flex items-center justify-center">
                        <span style={{ fontFamily: 'sans-serif', fontWeight: 'bold' }}>Pay</span>
                      </span>
                      Apple Pay
                    </label>
                  </div>
                  
                  {/* PayPal */}
                  <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                       onClick={() => setPaymentMethod('paypal')}>
                    <input
                      id="payment-paypal"
                      name="payment-method"
                      type="radio"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      disabled={status === 'submitting'}
                    />
                    <label htmlFor="payment-paypal" className="ml-3 block text-sm text-gray-900 flex items-center">
                      <span className="bg-blue-600 text-white p-1 rounded-md mr-2 text-xs font-bold">Pay<span className="text-blue-100">Pal</span></span>
                      PayPal
                    </label>
                  </div>
                  
                  {/* Zelle */}
                  <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                       onClick={() => setPaymentMethod('zelle')}>
                    <input
                      id="payment-zelle"
                      name="payment-method"
                      type="radio"
                      value="zelle"
                      checked={paymentMethod === 'zelle'}
                      onChange={() => setPaymentMethod('zelle')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      disabled={status === 'submitting'}
                    />
                    <label htmlFor="payment-zelle" className="ml-3 block text-sm text-gray-900 flex items-center">
                      <span className="bg-purple-600 text-white p-1 rounded-md mr-2 text-xs font-bold">Z</span>
                      Zelle
                    </label>
                  </div>
                  
                  {/* Bitcoin/Crypto */}
                  <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                       onClick={() => setPaymentMethod('bitcoin')}>
                    <input
                      id="payment-bitcoin"
                      name="payment-method"
                      type="radio"
                      value="bitcoin"
                      checked={paymentMethod === 'bitcoin'}
                      onChange={() => setPaymentMethod('bitcoin')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      disabled={status === 'submitting'}
                    />
                    <label htmlFor="payment-bitcoin" className="ml-3 block text-sm text-gray-900 flex items-center">
                      <span className="bg-orange-500 text-white p-1 rounded-md mr-2 text-xs">₿</span>
                      Bitcoin
                    </label>
                  </div>
                  
                  {/* Other Cryptocurrency */}
                  <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" 
                       onClick={() => setPaymentMethod('crypto')}>
                    <input
                      id="payment-crypto"
                      name="payment-method"
                      type="radio"
                      value="crypto"
                      checked={paymentMethod === 'crypto'}
                      onChange={() => setPaymentMethod('crypto')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      disabled={status === 'submitting'}
                    />
                    <label htmlFor="payment-crypto" className="ml-3 block text-sm text-gray-900 flex items-center">
                      <span className="bg-blue-500 text-white p-1 rounded-md mr-2 text-xs">Ξ</span>
                      Other Crypto
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 disabled:opacity-75"
              >
                {status === 'submitting' ? 'Processing...' : 'Place Order'}
              </button>

              {/* Payment Status Badge */}
              <div className="mt-4 flex justify-center">
                <PaymentStatusBadge status={status} />
              </div>

              {/* Special Apple Pay Section - Only shown when selected */}
              {paymentMethod === 'applePay' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-3">
                    After placing your order, you'll be able to complete payment with Apple Pay.
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src="https://developer.apple.com/design/human-interface-guidelines/foundations/branding/images/apple-pay-mark.png"
                      alt="Apple Pay" 
                      className="h-8" 
                    />
                  </div>
                </div>
              )}

              {/* Special PayPal Section - Only shown when selected */}
              {paymentMethod === 'paypal' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-3">
                    After placing your order, you'll be redirected to complete payment with PayPal.
                  </p>
                  <div className="flex justify-center">
                    <img 
                      src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png"
                      alt="PayPal" 
                      className="h-6" 
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
};

// Wrap the Cart component with the payment providers
const CartWithProviders: React.FC<CartProps> = (props) => {
  return (
    <PaymentProvider>
      <StripeProvider>
        <Cart {...props} />
      </StripeProvider>
    </PaymentProvider>
  );
};

export default CartWithProviders;
