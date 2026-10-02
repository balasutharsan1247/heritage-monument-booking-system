import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import { EmptyState } from './EmptyState';
import { ErrorState, formatErrorMessage } from './ErrorState';
import { Input } from './Input';
import { Select } from './Select';

describe('UI Design System Components', () => {
  describe('Button', () => {
    it('renders label and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Book Ticket</Button>);
      
      const btn = screen.getByRole('button', { name: /book ticket/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('displays loading state and disables button', () => {
      render(<Button loading>Submit Booking</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(screen.getByText('Submit Booking')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="gold">Gold Action</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-gold-500');

      rerender(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });
  });

  describe('StatusBadge', () => {
    it('renders confirmed ticket badge', () => {
      render(<StatusBadge type="ticket" status="booked" />);
      expect(screen.getByText(/confirmed/i)).toBeInTheDocument();
    });

    it('renders cancelled ticket badge', () => {
      render(<StatusBadge type="ticket" status="cancelled" />);
      expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    });

    it('renders queue status badge', () => {
      render(<StatusBadge type="queue" status="waiting" />);
      expect(screen.getByText(/waiting/i)).toBeInTheDocument();
    });

    it('renders monument status badge', () => {
      render(<StatusBadge type="monument" status={true} />);
      expect(screen.getByText(/open today/i)).toBeInTheDocument();
    });
  });

  describe('Modal', () => {
    it('does not render when isOpen is false', () => {
      render(<Modal isOpen={false} title="Test Modal">Content</Modal>);
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true and closes on ESC', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal Body Content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('renders EmptyState with action', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No passes found"
          description="You do not have any active passes."
          actionLabel="Explore Now"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No passes found')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /explore now/i }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('formats network error into user-friendly message', () => {
      const formatted = formatErrorMessage('Failed to fetch');
      expect(formatted).toMatch(/could not connect to the heritage portal service/i);
    });

    it('renders ErrorState with retry callback', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorState
          title="Connection Failure"
          description="Could not reach the server."
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText('Connection Failure')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input & Select', () => {
    it('renders Input with label and error', () => {
      render(
        <Input
          label="Visitor Name"
          error="Name is required"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByLabelText(/visitor name/i)).toBeInTheDocument();
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('renders Select with options', () => {
      render(
        <Select
          label="Category"
          options={[
            { value: 'regular', label: 'Regular Entry' },
            { value: 'vip', label: 'VIP Pass' },
          ]}
          value="regular"
          onChange={() => {}}
        />
      );

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('regular');
    });
  });
});
