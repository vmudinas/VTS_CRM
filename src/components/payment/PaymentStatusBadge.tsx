import React from 'react';
import { PaymentStatusType } from '../../context/PaymentContext';

interface PaymentStatusBadgeProps {
  status: PaymentStatusType;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  // Define status configurations
  const statusConfig: Record<PaymentStatusType, { label: string; color: string }> = {
    idle: {
      label: 'Ready',
      color: 'bg-gray-100 text-gray-800',
    },
    submitting: {
      label: 'Processing',
      color: 'bg-blue-100 text-blue-800',
    },
    success: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800',
    },
    error: {
      label: 'Failed',
      color: 'bg-red-100 text-red-800',
    },
    waitingForBitcoin: {
      label: 'Awaiting Bitcoin',
      color: 'bg-orange-100 text-orange-800',
    },
    bitcoinPaid: {
      label: 'Bitcoin Confirmed',
      color: 'bg-green-100 text-green-800',
    },
    waitingForPayPal: {
      label: 'Processing PayPal',
      color: 'bg-blue-100 text-blue-800',
    },
    paypalComplete: {
      label: 'PayPal Confirmed',
      color: 'bg-green-100 text-green-800',
    },
    waitingForZelle: {
      label: 'Awaiting Zelle',
      color: 'bg-yellow-100 text-yellow-800',
    },
    zelleComplete: {
      label: 'Zelle Confirmed',
      color: 'bg-green-100 text-green-800',
    },
    processingApplePay: {
      label: 'Processing Apple Pay',
      color: 'bg-gray-100 text-gray-800',
    },
    applePayComplete: {
      label: 'Apple Pay Confirmed',
      color: 'bg-green-100 text-green-800',
    }
  };

  const { label, color } = statusConfig[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

export default PaymentStatusBadge;