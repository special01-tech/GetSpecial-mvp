'use client';

import React, { useState } from 'react';

interface CustomerContactFormProps {
  slug: string;
  restaurantName: string;
}

export default function CustomerContactForm({ slug, restaurantName }: CustomerContactFormProps) {
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!contact.trim()) {
      setErrorMsg('Veuillez renseigner un email ou un numéro de téléphone.');
      return;
    }

    if (!consent) {
      setErrorMsg('Veuillez cocher la case pour donner votre consentement.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/r/${encodeURIComponent(slug)}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setSuccessMsg(json.data?.message || 'Merci ! Votre contact a bien été enregistré.');
        setContact('');
        setConsent(false);
      } else {
        setErrorMsg(json.error || 'Une erreur est survenue lors de l\'enregistrement.');
      }
    } catch {
      setErrorMsg('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '2px dashed #cbd5e1',
        borderRadius: '14px',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0' }}>
        🎁 Recevoir nos prochaines offres exclusives
      </h3>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
        Laissez votre email ou téléphone pour être prévenu en avant-première.
      </p>

      {successMsg ? (
        <div
          style={{
            background: '#dcfce7',
            border: '2px solid #86efac',
            color: '#15803d',
            padding: '14px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          ✅ {successMsg}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="email@exemple.com ou 0601020304"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '46px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '15px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              textAlign: 'left',
              marginBottom: '14px',
            }}
          >
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={loading}
              style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
            />
            <label
              htmlFor="consent"
              style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4, cursor: 'pointer' }}
            >
              J&apos;accepte de recevoir les offres et nouveaux menus de {restaurantName}. Désinscription possible en 1 clic.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              minHeight: '44px',
              backgroundColor: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Enregistrement...' : 'Je m\'inscris'}
          </button>
        </form>
      )}
    </div>
  );
}
