import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { api } from '../../api';
import { AlertCircle } from 'lucide-react';

export function TreasuryEditModal({ isOpen, onClose, transaction, onSuccess }) {
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('other');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setPurpose(transaction.purpose || 'other');
    }
    setError('');
  }, [transaction, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.updateTreasuryTransaction(transaction._id, {
        description: description.trim(),
        purpose,
      });

      if (res.success) {
        onSuccess('Treasury ledger record updated.');
        onClose();
      } else {
        setError(res.message || 'Failed to update record.');
      }
    } catch {
      setError('Network or server error updating record.');
    } finally {
      setSubmitting(false);
    }
  };

  const purposes = [
    { value: 'ticket_revenue', label: 'Ticket Booking Revenue' },
    { value: 'grant', label: 'Government Grant' },
    { value: 'subsidy', label: 'Tourism Subsidy' },
    { value: 'maintenance', label: 'Site Maintenance & Upkeep' },
    { value: 'restoration', label: 'Archaeological Restoration' },
    { value: 'manual_adjustment', label: 'Manual Adjustment' },
    { value: 'manual_debit', label: 'Operational Disbursement' },
    { value: 'other', label: 'Other Classification' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Treasury Ledger Record"
      description="Update financial description notes and audit classification for this entry."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
            Audit Classification
          </label>
          <Select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            options={purposes}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
            Description Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl bg-white text-charcoal-900 border border-sandstone-300 p-3 text-xs focus:outline-none focus:border-maroon-700 focus:ring-2 focus:ring-maroon-600/20"
          />
        </div>

        <div className="pt-2 flex gap-2.5">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={submitting}
            className="flex-1 py-2 font-semibold"
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="py-2"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
