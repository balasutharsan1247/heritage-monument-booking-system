import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserFormModal } from './UserFormModal';
import { ToastProvider } from '../../context/ToastContext';

const mockMonuments = [
  { _id: 'mon1', name: 'Taj Mahal', location: 'Agra' },
  { _id: 'mon2', name: 'Red Fort', location: 'Delhi' },
];

describe('UserFormModal RBAC & Allocation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Add User modal with staff role and monument station field by default', () => {
    render(
      <ToastProvider>
        <UserFormModal
          isOpen={true}
          onClose={vi.fn()}
          monuments={mockMonuments}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Add User / Staff / Administrator')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Monument Site Station/i)).toBeInTheDocument();
  });

  it('toggles monument allocation explanation when role is changed to Administrator or Visitor', () => {
    render(
      <ToastProvider>
        <UserFormModal
          isOpen={true}
          onClose={vi.fn()}
          monuments={mockMonuments}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    const roleSelect = screen.getByLabelText(/Assigned System Role/i);
    
    // Switch to admin
    fireEvent.change(roleSelect, { target: { value: 'admin' } });
    expect(screen.getByText(/Administrators have universal permissions across all monument stations/i)).toBeInTheDocument();
    expect(screen.queryByText(/Monument Site Station/i)).not.toBeInTheDocument();

    // Switch to visitor
    fireEvent.change(roleSelect, { target: { value: 'visitor' } });
    expect(screen.getByText(/Standard users do not require monument allocation/i)).toBeInTheDocument();

    // Switch back to staff
    fireEvent.change(roleSelect, { target: { value: 'staff' } });
    expect(screen.getByText(/Monument Site Station/i)).toBeInTheDocument();
  });

  it('pre-fills existing user data when in editing mode', () => {
    const existingStaff = {
      _id: 'user123',
      name: 'Ramesh Staff',
      email: 'ramesh@heritage.gov.in',
      role: 'staff',
      assignedMonument: 'mon1',
    };

    render(
      <ToastProvider>
        <UserFormModal
          isOpen={true}
          onClose={vi.fn()}
          user={existingStaff}
          monuments={mockMonuments}
          onSuccess={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Edit User Credentials & Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ramesh Staff')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ramesh@heritage.gov.in')).toBeInTheDocument();
    expect(screen.getByText(/New Password \(Optional\)/i)).toBeInTheDocument();
  });
});
