import React, { useState } from 'react';

interface ZelleInstructionsProps {
  amount: number;
  orderId: number | null;
  onConfirmPayment: () => Promise<void>;
  disabled?: boolean;
}

const ZelleInstructions: React.FC<ZelleInstructionsProps> = ({
  amount,
  orderId,
  onConfirmPayment,
  disabled = false
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleConfirmClick = async () => {
    if (!referenceNumber.trim()) {
      setConfirmationError('Please enter your Zelle reference/confirmation number');
      return;
    }

    try {
      setIsConfirming(true);
      setConfirmationError(null);
      await onConfirmPayment();
      // Success is handled by the parent component
    } catch (error) {
      console.error('Error confirming payment:', error);
      setConfirmationError('Failed to confirm payment. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="zelle-instructions bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">Pay with Zelle</h3>
      
      <div className="mb-4">
        <p className="text-sm mb-2">Please send your payment of <span className="font-bold">${amount.toFixed(2)}</span> to:</p>
        <div className="bg-white p-3 rounded border border-blue-100">
          <p className="font-semibold">Email: payments@example.com</p>
          <p className="text-sm text-gray-600">or</p>
          <p className="font-semibold">Phone: (555) 123-4567</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm mb-1">Important instructions:</p>
        <ul className="list-disc list-inside text-sm text-gray-700">
          <li>Include your Order ID <span className="font-semibold">#{orderId}</span> in the memo</li>
          <li>Complete the payment within 24 hours</li>
          <li>After sending payment, enter your reference number below</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Zelle Reference/Confirmation Number:
        </label>
        <input
          type="text"
          id="referenceNumber"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          disabled={disabled || isConfirming}
          placeholder="Enter the reference number from Zelle"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {confirmationError && (
          <p className="text-red-500 text-sm mt-1">{confirmationError}</p>
        )}
      </div>
      
      <button
        onClick={handleConfirmClick}
        disabled={disabled || isConfirming || !referenceNumber.trim()}
        className={`w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium
          ${(disabled || isConfirming || !referenceNumber.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`
        }
      >
        {isConfirming ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
            Confirming...
          </span>
        ) : 'I Have Sent the Payment'}
      </button>
    </div>
  );
};

export default ZelleInstructions;