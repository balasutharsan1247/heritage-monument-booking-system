import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Wallet from './Wallet';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    getWallet: vi.fn(),
    topupWallet: vi.fn(),
    debitWallet: vi.fn(),
  },
}));

vi.mock('../components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Wallet Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wallet balance and transaction history', async () => {
    api.getWallet.mockResolvedValue({
      success: true,
      data: {
        balance: 1500,
        currency: 'INR',
        transactions: [
          {
            _id: 'tx1',
            type: 'credit',
            amount: 1500,
            balanceAfter: 1500,
            purpose: 'topup',
            description: 'Wallet Top-up via UPI',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    render(
      <BrowserRouter>
        <Wallet />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('wallet-balance')).toHaveTextContent('1,500.00');
      expect(screen.getByText('Wallet Top-up via UPI')).toBeInTheDocument();
    });
  });

  it('opens top-up modal and submits funds', async () => {
    api.getWallet.mockResolvedValue({
      success: true,
      data: {
        balance: 500,
        currency: 'INR',
        transactions: [],
      },
    });

    api.topupWallet.mockResolvedValueOnce({
      success: true,
      message: 'Successfully added funds',
      data: {
        balance: 1000,
      },
    });

    render(
      <BrowserRouter>
        <Wallet />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Add Money/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Add Money/i }));

    expect(screen.getByText(/Add Money to Wallet/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. 500/i)).toBeInTheDocument();

    const amountInput = screen.getByPlaceholderText(/e.g. 500/i);
    fireEvent.change(amountInput, { target: { value: '500' } });

    const depositBtn = screen.getByRole('button', { name: /Deposit ₹500/i });
    fireEvent.click(depositBtn);

    await waitFor(() => {
      expect(api.topupWallet).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
        })
      );
    });
  });
});
