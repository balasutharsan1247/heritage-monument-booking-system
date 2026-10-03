import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { api } from '../../api';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Landmark, 
  FileText, 
  AlertCircle 
} from 'lucide-react';

export function TreasuryTransactionModal({
  isOpen,
  onClose,
  initialType = 'credit',
  monuments = [],
  currentBalance = 0,
  onSuccess,
}) {
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('grant');
  const [monumentId, setMonumentId] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Treasury Electronic Transfer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setType(initialType);
    setPurpose(initialType === 'credit' ? 'grant' : 'maintenance');
    setAmount('');
    setDescription('');
    setMonumentId('');
    setError('');
  }, [initialType, isOpen]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setPurpose(newType === 'credit' ? 'grant' : 'maintenance');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (type === 'debit' && numAmount > currentBalance) {
      setError(`Insufficient treasury reserve. Maximum available: ₹${currentBalance.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.createTreasuryTransaction({
        type,
        amount: numAmount,
        purpose,
        description: description.trim() || (type === 'credit' ? 'Treasury Capital Inflow' : 'Maintenance Disbursement'),
        monumentId: monumentId || null,
        paymentMethod,
      });

      if (res.success) {
        onSuccess(res.message || `${type === 'credit' ? 'Allocation' : 'Disbursement'} recorded successfully.`);
        onClose();
      } else {
        setError(res.message || 'Failed to record transaction.');
      }
    } catch {
      setError('Network or server error recording treasury transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const isCredit = type === 'credit';

  const creditPurposes = [
    { value: 'grant', label: 'Government Cultural Heritage Grant' },
    { value: 'subsidy', label: 'Tourism Development Subsidy' },
    { value: 'manual_adjustment', label: 'Treasury Capital Adjustment' },
    { value: 'other', label: 'Other Direct Allocation' },
  ];

  const debitPurposes = [
    { value: 'maintenance', label: 'Monument Site Maintenance & Upkeep' },
    { value: 'restoration', label: 'Archaeological Conservation & Restoration' },
    { value: 'manual_debit', label: 'Operational Infrastructure Expenditure' },
    { value: 'other', label: 'Other Administrative Disbursement' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCredit ? 'Record Treasury Allocation / Grant' : 'Disburse Treasury Maintenance Funds'}
      description={
        isCredit
          ? 'Add capital inflows, state subsidies, or heritage preservation grants to the Central Treasury.'
          : 'Authorize expenditures for monument restoration, security, or station facilities.'
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

        {/* Inflow vs Outflow Selector */}
        <div className="grid grid-cols-2 gap-2 bg-sandstone-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('credit')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCredit
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Inflow / Allocation</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('debit')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isCredit
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-charcoal-700 hover:text-charcoal-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Outflow / Disbursement</span>
          </button>
        </div>

        {/* Current Balance Callout */}
        <div className="bg-sandstone-50 border border-sandstone-200 p-3 rounded-xl flex items-center justify-between text-xs">
          <span className="text-charcoal-600 font-medium">Available Treasury Reserve:</span>
          <span className="font-bold font-sans text-maroon-900 text-sm">
            ₹{currentBalance.toLocaleString()}
          </span>
        </div>

        <Input
          label="Amount (₹)"
          type="number"
          min="1"
          step="any"
          required
          icon={Wallet}
          placeholder="e.g. 50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Select
          label="Financial Category / Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          options={isCredit ? creditPurposes : debitPurposes}
        />

        <Select
          label="Associated Monument Site (Optional)"
          value={monumentId}
          onChange={(e) => setMonumentId(e.target.value)}
          options={[
            { value: '', label: 'General / Central Reserve (Not monument-specific)' },
            ...monuments.map((m) => ({
              value: m._id,
              label: `${m.name} (${m.location || 'Site'})`,
            })),
          ]}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
            Description &amp; Audit Reference <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="2"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isCredit
                ? 'e.g. Annual ASI Central Tourism Grant FY26 Ref #ASI-GR-901'
                : 'e.g. Qutub Minar West Gate ticket scanner and turnstile maintenance'
            }
            className="w-full rounded-xl bg-white text-charcoal-900 border border-sandstone-300 p-3 text-xs focus:outline-none focus:border-maroon-700 focus:ring-2 focus:ring-maroon-600/20"
          />
        </div>

        <Input
          label="Payment / Transfer Channel"
          type="text"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder="e.g. RTGS / Treasury Transfer"
        />

        <div className="pt-3 flex gap-2.5">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            className={`flex-1 py-2.5 font-semibold ${
              isCredit ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
            }`}
          >
            {isCredit ? 'Record Allocation' : 'Authorize Disbursement'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={submitting}
            className="py-2.5"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
