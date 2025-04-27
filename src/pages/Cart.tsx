import React, { useState, useEffect } from 'react'; // Import useEffect
import { Link } from 'react-router-dom';
import { Product } from '../App';
import { orderService } from '../services';
import QRCode from 'qrcode.react'; // Import QRCode component

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
  const [paymentMethod, setPaymentMethod] = useState<'standard' | 'bitcoin'>('standard'); // Added payment method state
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'waitingForBitcoin' | 'bitcoinPaid'>('idle'); // Added 'waitingForBitcoin' and 'bitcoinPaid' status
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null); // Added state for Bitcoin address
  const [bitcoinAmount, setBitcoinAmount] = useState<number | null>(null); // Added state for Bitcoin amount

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

      if (paymentMethod === 'bitcoin') {
        setStatus('waitingForBitcoin'); // Set status to indicate waiting for Bitcoin details
        try {
          const bitcoinPaymentDetails = await orderService.generateBitcoinPayment(createdOrderId);
          setBitcoinAddress(bitcoinPaymentDetails.bitcoinAddress);
          setBitcoinAmount(bitcoinPaymentDetails.bitcoinAmount);
          // Status is already 'waitingForBitcoin', no need to set again
          setCartItems([]); // Clear cart after order creation
        } catch (bitcoinErr: any) {
          console.error('Error generating Bitcoin payment:', bitcoinErr);
          setErrorMessage(bitcoinErr.message || 'Failed to generate Bitcoin payment details.');
          setStatus('error');
        }
      } else { // Standard payment
        setStatus('success');
        setCartItems([]); // Clear cart after order creation
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
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-4">Your order ID is {orderId}</p>
        <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  if (status === 'bitcoinPaid') { // New status for confirmed Bitcoin payment
      return (
          <div className="animate-fade-in text-center py-12">
              <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4">Bitcoin Payment Confirmed!</h1>
              <p className="text-gray-600 mb-4">Your order ID is {orderId}. Your payment has been confirmed.</p>
              <Link to="/" className="text-primary-600 hover:underline">Continue Shopping</Link>
          </div>
      );
  }

  if (status === 'waitingForBitcoin') {
    // Construct the bitcoin URI for the QR code
    const bitcoinUri = bitcoinAddress && bitcoinAmount !== null
        ? `bitcoin:${bitcoinAddress}?amount=${bitcoinAmount.toFixed(8)}`
        : '';

    return (
      <div className="animate-fade-in text-center py-12">
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-4">Waiting for Bitcoin Payment</h1>
        <p className="text-gray-600 mb-4">
          Your order ID is {orderId}. Please send the exact Bitcoin amount to the address below.
        </p>
        {bitcoinAddress && (
          <div className="flex flex-col items-center"> {/* Center the QR code */}
            <p className="text-gray-800 font-semibold break-all mb-4">Address: {bitcoinAddress}</p>
            {bitcoinUri && (
                <QRCode value={bitcoinUri} size={256} level="H" />
            )}
          </div>
        )}
        {bitcoinAmount !== null && (
           <p className="text-gray-800 font-semibold mt-4">Amount: {bitcoinAmount.toFixed(8)} BTC</p> // Displaying in BTC with 8 decimals
        )}
        <p className="text-gray-600 mt-4">Waiting for transaction confirmation...</p>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>} {/* Display error message here too */}
        <Link to="/" className="text-primary-600 hover:underline mt-4 inline-block">Return to Home</Link>
      </div>
    );
  }

    if (status === 'error') { // Display error message for general errors
        return (
            <div className="animate-fade-in text-center py-12">
                <h1 className="font-heading text-3xl font-bold text-red-600 mb-4">Payment Error</h1>
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
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
                    <label htmlFor="payment-standard" className="ml-2 block text-sm text-gray-900">
                      Standard Payment
                    </label>
                  </div>
                  <div className="flex items-center">
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
                    <label htmlFor="payment-bitcoin" className="ml-2 block text-sm text-gray-900">
                      Bitcoin
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 disabled:opacity-75"
              >
                {status === 'submitting' ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
