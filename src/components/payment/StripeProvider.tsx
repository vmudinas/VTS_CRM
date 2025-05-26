import React, { ReactNode } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Stripe public key - in a real app, this should be in an .env file
const STRIPE_PUBLIC_KEY = 'pk_test_1234567890'; // Replace with actual test key

// Initialize Stripe.js
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

interface StripeProviderProps {
  children: ReactNode;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;