"use client";

import { useState } from 'react';
import { Mail, MapPin, Phone, Send, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

const API_URL = 'https://ji-africa-backend.onrender.com/api';

export default function ContactPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    subject: 'General Support',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setForm({ full_name: '', email: '', subject: 'General Support', message: '' });
      } else {
        setError(data.error || 'Could not send message.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      <div className="bg-gray-900 text-white rounded-2xl p-8 md:p-12">
        <span className="inline-flex items-center gap-1.5 bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full text-xs font-bold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Help &amp; Support Center
        </span>
        <h1 className="text-3xl font-black">Contact ji.africa Support</h1>
        <p className="text-sm text-gray-300 mt-2 max-w-xl">
          Have questions about seller verification, VIP ad promotions, or reporting a suspicious listing? Send us a direct message below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900 uppercase">Headquarters</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  JI AFRICA LIMITED • Abuja (FCT), Nigeria
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900 uppercase">Email Support</p>
                <p className="text-xs text-gray-600 mt-0.5">support@ji.africa</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-gray-900 uppercase">Operating Hours</p>
                <p className="text-xs text-gray-600 mt-0.5">Mon – Sat: 8:00 AM – 6:00 PM WAT</p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="text-xl font-black text-gray-900">Message Received</h2>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                Thank you for contacting ji.africa. Our support team has logged your ticket and will reply to your email shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-black text-gray-900 text-lg">Send Us a Message</h2>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Topic
                </label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-brand-orange"
                >
                  <option value="General Support">General Support</option>
                  <option value="Seller KYC Verification">Seller KYC Verification</option>
                  <option value="VIP Boost & Billing">VIP Boost &amp; Billing</option>
                  <option value="Safety & Fraud Report">Safety &amp; Fraud Report</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Message *
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe how we can help you..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-orange"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Support Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
