'use client';

import React, { useState } from 'react';

export default function DashboardPage() {
  const [isPaused, setIsPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const togglePause = async () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    setStatusMessage(nextState ? 'Pause globale activée : aucune publication ne sera émise.' : 'Pause désactivée : publications autorisées.');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
      {/* En-tête & Interrupteur de sécurité */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #374151', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 6px 0', background: 'linear-gradient(90deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GetSpecial Console Gérant
          </h1>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            Marketing contextuel intelligent • Pilotage météo, événements & réseaux sociaux
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={togglePause}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.2s',
              backgroundColor: isPaused ? '#ef4444' : '#10b981',
              color: '#ffffff',
            }}
          >
            {isPaused ? '🔴 Pause Active (Arrêt Sécurité)' : '🟢 Diffusion Active'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: isPaused ? '#450a0a' : '#064e3b', color: '#f3f4f6', marginBottom: '24px', border: `1px solid ${isPaused ? '#ef4444' : '#10b981'}` }}>
          {statusMessage}
        </div>
      )}

      {/* Grille principale : Boucle Phares (Signaux -> Opportunités -> Validation -> Publication) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Phase 3 : Signal Collector */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>🌤️ Signaux Détectés</h2>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#374151', color: '#9ca3af' }}>OpenWeather</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#111827', marginBottom: '10px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#38bdf8' }}>Ensoleillé & 22°C ce midi</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Opportunité optimale pour le service en terrasse.</div>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#111827' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#c084fc' }}>Événement de quartier</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Concert à 600m à 19h30 : affluence attendue.</div>
          </div>
        </div>

        {/* Phase 4 : Opportunity Engine */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>💡 Opportunités du Jour</h2>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#064e3b', color: '#34d399' }}>Claude 3.5</span>
          </div>
          <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#111827', borderLeft: '4px solid #f59e0b', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: '14px' }}>Mise en avant Terrasse & Fraîcheur</strong>
              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>URGENCE : IMMÉDIATE</span>
            </div>
            <p style={{ fontSize: '13px', color: '#d1d5db', margin: '8px 0' }}>
              La météo douce se prête à un push Instagram sur votre cocktail signature et les places extérieures.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
                ✨ Générer le Post
              </button>
              <button style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#374151', color: '#d1d5db', border: 'none', cursor: 'pointer' }}>
                Rejeter
              </button>
            </div>
          </div>
        </div>

        {/* Phase 5 & 6 : Content & Validation Manuelle */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>✍️ Validation Manuelle</h2>
            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#854d0e', color: '#fde047' }}>Pending Approval</span>
          </div>
          <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#111827' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Canal cible : Instagram • 11h30</div>
            <textarea
              defaultValue="☀️ 22°C et un grand soleil aujourd'hui ! Notre terrasse est fin prête pour votre pause déjeuner. Venez savourer notre menu de saison en plein air. 🌿🍹 #terrasse #soleil #dejeuner"
              rows={4}
              style={{ width: '100%', backgroundColor: '#1f2937', color: '#f3f4f6', border: '1px solid #4b5563', borderRadius: '6px', padding: '8px', fontSize: '13px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '6px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>
                ✅ Approuver & Publier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 7 : Comptes Réseaux Connectés */}
      <div style={{ marginTop: '24px', backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', border: '1px solid #374151' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>📱 Canaux de Diffusion (Outstand)</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', padding: '14px', borderRadius: '8px', backgroundColor: '#111827', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Instagram</div>
              <div style={{ fontSize: '12px', color: '#10b981' }}>● Connecté (@restaurant_paris)</div>
            </div>
            <button style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#374151', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Déconnecter</button>
          </div>
          <div style={{ flex: '1', minWidth: '220px', padding: '14px', borderRadius: '8px', backgroundColor: '#111827', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Facebook</div>
              <div style={{ fontSize: '12px', color: '#10b981' }}>● Connecté (Page Restaurant)</div>
            </div>
            <button style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#374151', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Déconnecter</button>
          </div>
          <div style={{ flex: '1', minWidth: '220px', padding: '14px', borderRadius: '8px', backgroundColor: '#111827', border: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Google Business</div>
              <div style={{ fontSize: '12px', color: '#f59e0b' }}>Accès demandé</div>
            </div>
            <button style={{ padding: '6px 10px', fontSize: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Connecter</button>
          </div>
        </div>
      </div>
    </div>
  );
}
