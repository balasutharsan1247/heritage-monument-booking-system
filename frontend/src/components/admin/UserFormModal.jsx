import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Landmark, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../ui/Toast';

export function UserFormModal({ isOpen, onClose, user, monuments = [], onSuccess }) {
  const isEditing = Boolean(user);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    assignedMonument: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role === 'admin' ? 'admin' : user.role === 'staff' ? 'staff' : 'visitor',
        assignedMonument: user.assignedMonument?._id || user.assignedMonument || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        assignedMonument: monuments.length > 0 ? monuments[0]._id : '',
      });
    }
    setError('');
  }, [user, isOpen, monuments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide a full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please provide an email address.');
      return;
    }

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      setError('Password is required and must be at least 6 characters.');
      return;
    }

    if (isEditing && formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.role === 'staff' && !formData.assignedMonument) {
      setError('Please select an allocated monument site for this staff member.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        assignedMonument: formData.role === 'staff' ? formData.assignedMonument : null,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      let res;
      if (isEditing) {
        res = await api.updateAdminUser(user._id, payload);
      } else {
        res = await api.createAdminUser(payload);
      }

      if (res.success) {
        toast.success(
          isEditing 
            ? `User "${res.data?.name || formData.name}" updated successfully.` 
            : `New ${formData.role === 'staff' ? 'Staff' : formData.role === 'admin' ? 'Admin' : 'User'} account created.`
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.message || 'Operation failed. Please verify the input.');
      }
    } catch (err) {
      setError('Network error occurred while saving user.');
    } finally {
      setLoading(false);
    }
  };

  const monumentOptions = [
    { value: '', label: 'Select a monument station...' },
    ...monuments.map((m) => ({
      value: m._id,
      label: `${m.name} — ${m.location || 'Site'}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Credentials & Role' : 'Add User / Staff / Administrator'}
      description={
        isEditing
          ? 'Modify account credentials, role privilege, or station allocation.'
          : 'Create a new user, allocate staff to a monument site, or grant administrator rights.'
      }
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          required
          icon={User}
          placeholder="e.g. Ramesh Kumar"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <Input
          label="Email Address"
          type="email"
          required
          icon={Mail}
          placeholder="e.g. staff.ramesh@heritage.gov.in"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <Input
          label={isEditing ? 'New Password (Optional)' : 'Account Password'}
          type="password"
          required={!isEditing}
          icon={Lock}
          placeholder={isEditing ? 'Leave blank to keep existing password' : 'Min 6 characters'}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          helperText={
            isEditing
              ? 'Only enter a password if you wish to reset this user\'s credentials.'
              : 'Provide an initial password for this account.'
          }
        />

        <Select
          label="Assigned System Role (RBAC)"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          options={[
            { value: 'staff', label: 'Staff Member (Allocated to Monument Gate)' },
            { value: 'visitor', label: 'User / Visitor (General Ticket Booking)' },
            { value: 'admin', label: 'Administrator (Full System & RBAC Access)' },
          ]}
        />

        {/* Dynamic Allocation Section */}
        {formData.role === 'staff' ? (
          <div className="p-3.5 bg-sandstone-50 border border-sandstone-300 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-charcoal-800">
              <Landmark className="w-4 h-4 text-maroon-800 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Monument Site Station <span className="text-red-500">*</span>
              </span>
            </div>
            
            <Select
              value={formData.assignedMonument}
              onChange={(e) => setFormData({ ...formData, assignedMonument: e.target.value })}
              options={monumentOptions}
            />

            <p className="text-[11px] text-charcoal-500 leading-relaxed">
              This staff member will be strictly allocated to this single monument. They will only have permissions to manage tickets and queues at this station.
            </p>
          </div>
        ) : formData.role === 'admin' ? (
          <div className="p-3 bg-maroon-50/70 border border-maroon-200 rounded-2xl flex items-center gap-2.5 text-xs text-maroon-900">
            <ShieldCheck className="w-4 h-4 text-maroon-800 shrink-0" />
            <span>Administrators have universal permissions across all monument stations, bookings, and financial logs.</span>
          </div>
        ) : (
          <div className="p-3 bg-sandstone-50 border border-sandstone-200 rounded-2xl flex items-center gap-2.5 text-xs text-charcoal-600">
            <CheckCircle2 className="w-4 h-4 text-charcoal-500 shrink-0" />
            <span>Standard users do not require monument allocation. They can book tickets to any open monument.</span>
          </div>
        )}

        <div className="pt-3 flex gap-2.5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            className="flex-1 py-2.5 font-semibold"
          >
            {isEditing ? 'Save Account Changes' : 'Create Account'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={loading}
            className="py-2.5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
