'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormInput } from '@/lib/types';

const MGMT_OPTIONS = ['Self-managed', 'Have a PM', 'No PM yet'] as const;

interface FieldErrors {
  [key: string]: string[] | undefined;
}

export default function LeaseUpForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    ownerName: '',
    email: '',
    phone: '',
    zillowUrl: '',
    askingRent: '',
    daysOnMarket: '',
    currentlyVacant: false,
    managementSituation: 'Self-managed' as FormInput['managementSituation'],
  });

  function updateField(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    setFieldErrors({});
    setIsSubmitting(true);

    const payload: FormInput = {
      ownerName: form.ownerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      zillowUrl: form.zillowUrl.trim(),
      askingRent: Number(form.askingRent) || 0,
      daysOnMarket: Number(form.daysOnMarket) || 0,
      currentlyVacant: form.currentlyVacant,
      managementSituation: form.managementSituation,
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Handle non-JSON responses (Vercel timeout, HTML error pages)
      let data;
      try {
        data = await res.json();
      } catch {
        console.error('API returned non-JSON response, status:', res.status);
        setServerError(`Server error (${res.status}). Please try again in a moment.`);
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
        }
        setServerError(data.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Store results in sessionStorage and redirect
      sessionStorage.setItem('leaseUpResults', JSON.stringify({
        input: payload,
        property: data.property,
        score: data.score,
      }));
      router.push('/results');
    } catch (err) {
      console.error('Form submission error:', err);
      setServerError('Network error. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lease-form" id="audit-form">
      {/* Owner Info */}
      <div className="form-section">
        <h3 className="form-section__title">Your Information</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="ownerName">Full Name</label>
          <input
            id="ownerName"
            className={`form-input ${fieldErrors.ownerName ? 'form-input--error' : ''}`}
            type="text"
            placeholder="John Smith"
            value={form.ownerName}
            onChange={e => updateField('ownerName', e.target.value)}
            required
          />
          <span className="form-error">{fieldErrors.ownerName?.[0] ?? ''}</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className={`form-input ${fieldErrors.email ? 'form-input--error' : ''}`}
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              required
            />
            <span className="form-error">{fieldErrors.email?.[0] ?? ''}</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              className={`form-input ${fieldErrors.phone ? 'form-input--error' : ''}`}
              type="tel"
              placeholder="(555) 123-4567"
              value={form.phone}
              onChange={e => updateField('phone', e.target.value)}
              required
            />
            <span className="form-error">{fieldErrors.phone?.[0] ?? ''}</span>
          </div>
        </div>
      </div>

      {/* Zillow Listing */}
      <div className="form-section">
        <h3 className="form-section__title">Your Listing</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="zillowUrl">Zillow Listing URL</label>
          <input
            id="zillowUrl"
            className={`form-input form-input--zillow ${fieldErrors.zillowUrl ? 'form-input--error' : ''}`}
            type="url"
            placeholder="https://www.zillow.com/homedetails/..."
            value={form.zillowUrl}
            onChange={e => updateField('zillowUrl', e.target.value)}
            required
          />
          <span className="form-error">{fieldErrors.zillowUrl?.[0] ?? ''}</span>
          <span className="form-hint">
            Paste the Zillow link for your rental listing. We&apos;ll pull the property details automatically.
          </span>
        </div>
      </div>

      {/* Leasing Status */}
      <div className="form-section">
        <h3 className="form-section__title">Leasing Status</h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="askingRent">Asking Rent ($/mo)</label>
            <input
              id="askingRent"
              className={`form-input ${fieldErrors.askingRent ? 'form-input--error' : ''}`}
              type="number"
              min="0"
              placeholder="2,000"
              value={form.askingRent}
              onChange={e => updateField('askingRent', e.target.value)}
              required
            />
            <span className="form-error">{fieldErrors.askingRent?.[0] ?? ''}</span>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="daysOnMarket">Days on Market</label>
            <input
              id="daysOnMarket"
              className="form-input"
              type="number"
              min="0"
              placeholder="30"
              value={form.daysOnMarket}
              onChange={e => updateField('daysOnMarket', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="managementSituation">Management Situation</label>
          <select
            id="managementSituation"
            className="form-select"
            value={form.managementSituation}
            onChange={e => updateField('managementSituation', e.target.value)}
          >
            {MGMT_OPTIONS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <label className="form-toggle" htmlFor="currentlyVacant">
          <input
            id="currentlyVacant"
            type="checkbox"
            checked={form.currentlyVacant}
            onChange={e => updateField('currentlyVacant', e.target.checked)}
          />
          <span className="form-label">Property is currently vacant</span>
        </label>
      </div>

      {/* Submit */}
      {serverError && (
        <div className="form-server-error">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        className="btn btn--primary btn--large form-submit-btn"
        disabled={isSubmitting}
        id="submit-btn"
      >
        {isSubmitting ? (
          <>
            <span className="spinner" />
            Analyzing Your Listing…
          </>
        ) : (
          'Unlock Your Free Lease-Up Audit →'
        )}
      </button>
    </form>
  );
}
