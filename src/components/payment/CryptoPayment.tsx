import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface CryptoPaymentProps {
  address: string | null;
  amount: number | null;
  cryptoType: 'bitcoin' | 'ethereum' | 'litecoin' | 'other';
  isWaiting: boolean;
  orderId: number | null;
}

const CryptoPayment: React.FC<CryptoPaymentProps> = ({
  address,
  amount,
  cryptoType,
  isWaiting,
  orderId
}) => {
  // Create appropriate URI for QR code based on crypto type
  const getQrCodeUri = (): string => {
    if (!address || amount === null) return '';

    switch (cryptoType) {
      case 'bitcoin':
        return `bitcoin:${address}?amount=${amount.toFixed(8)}`;
      case 'ethereum':
        return `ethereum:${address}?value=${amount}`;
      case 'litecoin':
        return `litecoin:${address}?amount=${amount.toFixed(8)}`;
      default:
        return address; // Just use the address if the protocol is not known
    }
  };

  // Get crypto icon and name
  const getCryptoDetails = () => {
    switch (cryptoType) {
      case 'bitcoin':
        return { name: 'Bitcoin', symbol: 'BTC', icon: '₿' };
      case 'ethereum':
        return { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' };
      case 'litecoin':
        return { name: 'Litecoin', symbol: 'LTC', icon: 'Ł' };
      default:
        return { name: 'Cryptocurrency', symbol: '', icon: '₵' };
    }
  };

  const cryptoDetails = getCryptoDetails();
  const qrCodeUri = getQrCodeUri();

  return (
    <div className="crypto-payment bg-indigo-50 p-4 rounded-lg border border-indigo-200">
      <h3 className="text-lg font-semibold text-indigo-800 mb-2">
        Pay with {cryptoDetails.name} {cryptoDetails.icon}
      </h3>
      
      {isWaiting ? (
        <>
          <p className="text-sm mb-4">
            Your order ID is {orderId}. Please send the exact amount to the address below:
          </p>
          
          {address && (
            <div className="flex flex-col items-center"> {/* Center the QR code */}
              <p className="text-gray-800 font-semibold break-all mb-4 text-sm text-center">
                {address}
              </p>
              {qrCodeUri && (
                <QRCodeCanvas value={qrCodeUri} size={256} level="H" />
              )}
            </div>
          )}
          
          {amount !== null && (
            <p className="text-indigo-800 font-semibold text-center mt-4">
              Amount: {amount.toFixed(8)} {cryptoDetails.symbol}
            </p>
          )}
          
          <div className="mt-4 text-sm bg-white p-3 rounded-lg border border-indigo-100">
            <p className="font-semibold mb-1">Important:</p>
            <ul className="list-disc list-inside text-gray-700">
              <li>Send exactly the requested amount</li>
              <li>Transaction may take 10-60 minutes to confirm</li>
              <li>Do not close this page until payment is confirmed</li>
            </ul>
          </div>
          
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-pulse flex items-center">
              <div className="h-3 w-3 bg-indigo-600 rounded-full mr-1"></div>
              <div className="h-3 w-3 bg-indigo-500 rounded-full mr-1 animate-pulse-delay-200"></div>
              <div className="h-3 w-3 bg-indigo-400 rounded-full animate-pulse-delay-400"></div>
              <p className="ml-2 text-indigo-700">Waiting for transaction confirmation...</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p>Generating {cryptoDetails.name} payment address...</p>
        </div>
      )}
    </div>
  );
};

export default CryptoPayment;