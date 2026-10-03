import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { api } from '../../api';

export const MonumentFormModal = ({
  isOpen,
  onClose,
  monument = null,
  onSuccess,
}) => {
  const isEdit = Boolean(monument?._id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    capacity: 100,
    baseTicketPrice: 50,
    openingTime: '09:00',
    closingTime: '17:00',
    imageUrl: '',
    latitude: 20.0,
    longitude: 78.0,
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState([]);

  useEffect(() => {
    if (monument) {
      setForm({
        name: monument.name || '',
        description: monument.description || '',
        location: monument.location || '',
        capacity: monument.capacity ?? 100,
        baseTicketPrice: monument.baseTicketPrice ?? 50,
        openingTime: monument.openingTime || '09:00',
        closingTime: monument.closingTime || '17:00',
        imageUrl: monument.imageUrl || '',
        latitude: monument.latitude ?? 20.0,
        longitude: monument.longitude ?? 78.0,
        isActive: monument.isActive ?? true,
      });
    } else {
      setForm({
        name: '',
        description: '',
        location: '',
        capacity: 100,
        baseTicketPrice: 50,
        openingTime: '09:00',
        closingTime: '17:00',
        imageUrl: '',
        latitude: 20.0,
        longitude: 78.0,
        isActive: true,
      });
    }
    setFormErrors([]);
  }, [monument, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      baseTicketPrice: Number(form.baseTicketPrice),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };

    try {
      let res;
      if (isEdit) {
        res = await api.updateMonument(monument._id, payload);
      } else {
        res = await api.createMonument(payload);
      }

      if (res.success) {
        onSuccess(isEdit ? 'Monument updated successfully' : 'Monument created successfully');
        onClose();
      } else {
        setFormErrors(res.errors || [res.message || 'Operation failed']);
      }
    } catch (err) {
      setFormErrors(['Network or server error while saving monument']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Monument Details' : 'Add New Heritage Monument'}
      description="Configure public capacity limits, operating hours, and ticket prices."
      maxWidth="max-w-2xl"
    >
      {formErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-5 text-xs font-semibold space-y-1">
          {formErrors.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Monument Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Taj Mahal, Red Fort"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
            Description
          </label>
          <textarea
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Historical architectural background and significance..."
            className="w-full rounded-xl bg-white text-charcoal-900 border border-sandstone-300 p-3 text-sm focus:outline-none focus:border-maroon-700 focus:ring-2 focus:ring-maroon-600/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Location (City, State)"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Agra, Uttar Pradesh"
          />

          <div>
            <Input
              label="Image URL or Path"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="e.g. /images/taj-mahal.jpg or https://..."
              helperText="Local path (e.g. /images/red-fort.jpg) or HTTPS URL"
            />
            {form.imageUrl?.trim() && (
              <div className="mt-2 flex items-center gap-2.5 p-2 bg-sandstone-50 border border-sandstone-200 rounded-lg">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-12 h-9 object-cover rounded border border-sandstone-300 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-charcoal-800">Image Preview</p>
                  <p className="text-[10px] text-charcoal-400 truncate">{form.imageUrl}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Slot Capacity"
            type="number"
            min="1"
            required
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />

          <Input
            label="Base Price (₹)"
            type="number"
            min="0"
            required
            value={form.baseTicketPrice}
            onChange={(e) => setForm({ ...form, baseTicketPrice: e.target.value })}
          />

          <Input
            label="Opening (HH:MM)"
            required
            pattern="^([01]\d|2[0-3]):([0-5]\d)$"
            value={form.openingTime}
            onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
            placeholder="09:00"
          />

          <Input
            label="Closing (HH:MM)"
            required
            pattern="^([01]\d|2[0-3]):([0-5]\d)$"
            value={form.closingTime}
            onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
            placeholder="17:00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
          />

          <Input
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="modalIsActiveToggle"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-5 h-5 accent-maroon-800 rounded cursor-pointer"
          />
          <label htmlFor="modalIsActiveToggle" className="text-sm font-bold text-charcoal-800 cursor-pointer">
            Monument is currently Open and Active for bookings
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-sandstone-200 mt-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Monument'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
