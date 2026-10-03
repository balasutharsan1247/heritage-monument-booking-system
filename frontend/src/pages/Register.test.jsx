import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Register from './Register';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock Google OAuth
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <button>Mock Google Login</button>,
}));

describe('Register Page Tests', () => {
  it('renders registration form without role selection dropdown', () => {
    render(
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Register />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    );

    // Verify presence of standard registration fields
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();

    // Verify role selection dropdown is REMOVED
    expect(screen.queryByLabelText(/Account Category/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Role/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Site Staff')).not.toBeInTheDocument();
    expect(screen.queryByText('Administrator')).not.toBeInTheDocument();
  });
});
