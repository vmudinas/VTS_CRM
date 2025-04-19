import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './Home';
import { Product } from '../App';

describe('ProductCard', () => {
  const dummyProduct: Product = {
    id: 1,
    name: 'Test Product',
    price: 9.99,
    image: 'test.jpg',
    badge: 'New',
    description: 'Test description',
    category: 'Test',
    quantity: 2,
  };

  test('renders product details and calls onAddToCart when available', () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={dummyProduct} onAddToCart={onAddToCart} />);
    expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
    expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Add to Cart/i });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  test('disables button and shows Out of Stock when quantity is 0', () => {
    const p = { ...dummyProduct, quantity: 0 };
    const onAddToCart = jest.fn();
    render(<ProductCard product={p} onAddToCart={onAddToCart} />);
    const button = screen.getByRole('button', { name: /Out of Stock/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onAddToCart).not.toHaveBeenCalled();
  });
});