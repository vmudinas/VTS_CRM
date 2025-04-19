import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryTab } from './Home';

describe('CategoryTab', () => {
  test('renders label and handles click', () => {
    const onClick = jest.fn();
    render(<CategoryTab category="Test" label="Test Label" active={false} onClick={onClick} />);
    const button = screen.getByRole('button', { name: /Test Label/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('applies active styles when active', () => {
    render(<CategoryTab category="Test" label="Active Label" active onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /Active Label/i });
    expect(button).toHaveClass('bg-primary-600', 'text-white');
  });
});