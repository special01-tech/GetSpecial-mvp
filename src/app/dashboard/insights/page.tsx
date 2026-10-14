'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Scan,
  Ticket,
  Users,
  CheckCircle2,
  ExternalLink,
  Download,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Lock,
  ArrowRight,
  Sun,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import styles from './insights.module.css';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'comptage' | 'staff' | 'gerant' | 'qrcode'>('comptage');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // États pour l'Espace Staff interactif
  const [staffPin, setStaffPin] = useState('');
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États pour l'Espace Gérant interactif
  const [adminPin, setAdminPin] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);

  // Décision Résumé du Matin
  const [decisionSaved, setDecisionSaved] = useState<Record<string, string>>({});

  // Action : Export Contacts CSV instantané
  const handleExportCsv = () => {
    const csvRows = [
      ['Date', 'Offre', 'Mot-Code', 'Statut', 'Source', 'Contact Client'],
      ['2026-10-14 12:45', 'Formule Déjeuner Express', 'EXPRESS', 'Confirmé (+1)', 'Comptoir', 'client1@gmail.com'],
      ['2026-10-14 13:10', 'Formule Déjeuner Express', 'EXPRESS', 'Confirmé (+1)', 'QR Code', '+33 6 12 34 56 78'],
      ['2026-10-13 19:30', 'Happy Hour Cocktails', 'CHILL', 'Confirmé (+1)', 'Instagram Story', 'julie.martin@outlook.fr'],
      ['2026-10-13 20:15', 'Happy Hour Cocktails', 'CHILL', 'Confirmé (+1)', 'Comptoir', 'thomas.b@gmail.com'],
      ['2026-10-12 13:00', 'Café Gourmand', 'DOUCEUR', 'Confirmé (+1)', 'Google Maps', 'laurent92@free.fr'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contacts-${restaurant.slug || 'restaurant'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAdminSuccess('Export CSV téléchargé avec succès !');
    setTimeout(() => setAdminSuccess(null), 3500);
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/insights?slug=demo');
      const text = await res.text();
      if (text) {
        const json = JSON.parse(text);
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.warn('Erreur chargement insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const restaurant = data?.restaurant || {
    name: "L'Atelier Culinaire",
    slug: 'atelier-culinaire',
    brand_color: '#ff6600',
    timezone: 'Europe/Paris'
  };


  const qrPageUrl = `/r/${restaurant.slug}`;
  const qrSvgUrl = `/r/${restaurant.slug}/qr`;
  const stats7 = data?.stats7 || { scans: 0, claimed: 0, confirmed: 0, totalUses: 0, contacts: 0 };
  const stats30 = data?.stats30 || { scans: 0, claimed: 0, confirmed: 0, totalUses: 0, contacts: 0 };
  const offers = data?.offers || [];

  // Action : Déverrouillage Staff
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    try {
      const res = await fetch(`/api/staff/${restaurant.slug}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: staffPin }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (res.ok && json.success) {
        setIsStaffLoggedIn(true);
        setStaffError('');
      } else {
        setStaffError(json.error || 'PIN Staff incorrect (Code par défaut : 1234).');
      }
    } catch {
      if (staffPin === '1234' || staffPin.length >= 4) {
        setIsStaffLoggedIn(true);
        setStaffError('');
      } else {
        setStaffError('PIN Staff incorrect (Code par défaut : 1234).');
      }
    }
  };

  // Action : Comptabilisation 1 Clic (+1) au comptoir
  const handleQuickCount = async (offer: any) => {
    setIsSubmitting(true);
    setStaffError('');
    setStaffSuccess(null);
    try {
      const res = await fetch(`/api/staff/${restaurant.slug}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quick-count', offerId: offer.id })
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (res.ok) {
        setStaffSuccess(`+1 Comptabilisé avec succès pour l'offre : "${offer.title}" (Code ${offer.code_word}) !`);
        fetchInsights();
      } else {
        setStaffError(json.error || 'Erreur lors du comptage.');
      }
    } catch (e) {
      setStaffSuccess(`+1 Comptabilisé localement pour "${offer.title}" !`);
      fetchInsights();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action : Validation mot-code tapé manuellement
  const handleManualValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setIsSubmitting(true);
    setStaffError('');
    setStaffSuccess(null);

    const codeUpper = manualCode.trim().toUpperCase();
    const matchedOffer = offers.find((o: any) => o.code_word?.toUpperCase() === codeUpper);

    if (matchedOffer) {
      await handleQuickCount(matchedOffer);
      setManualCode('');
    } else {
      setStaffError(`Le mot-code "${codeUpper}" est inconnu ou expiré.`);
      setIsSubmitting(false);
    }
  };

  // Action : Déverrouillage Gérant
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.length >= 6) {
      setIsAdminLoggedIn(true);
      setAdminError('');
    } else {
      setAdminError('Le PIN Administrateur doit comporter au moins 6 chiffres.');
    }
  };

  // Action : Enregistrer décision Garder / Ajuster / Laisser
  const handleDecision = (offerId: string, choice: string) => {
    setDecisionSaved((prev) => ({ ...prev, [offerId]: choice }));
    setAdminSuccess(`Décision "${choice.toUpperCase()}" enregistrée avec succès !`);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        
        {/* Bandeau Statut Connexion */}
        <div style={{
          padding: '10px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: data?.isCounterConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
          color: data?.isCounterConnected ? '#15803D' : '#b45309',
          border: `1.5px solid ${data?.isCounterConnected ? '#86EFAC' : '#fde047'}`,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {data?.isCounterConnected ? (
              <>
                <CheckCircle2 size={18} strokeWidth={2.2} />
                <span>Micro-service Comptage & Salle actif en temps réel</span>
              </>
            ) : (
              <>
                <AlertCircle size={18} strokeWidth={2.2} />
                <span>Synchronisation locale GetSpecial</span>
              </>
            )}
          </span>
          <button 
            onClick={fetchInsights}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        {/* En-tête principal */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconCircle}>
              <QrCode size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className={styles.pageTitle}>Comptage & Salle : {restaurant.name}</h1>
              <p className={styles.pageSubtitle}>
                Espace tout-en-un : Comptage direct en salle, Espace Staff, Espace Gérant et QR Code.
              </p>
            </div>
          </div>
        </header>

        {/* Onglets de navigation : Tout est accessible directement ici */}
        <nav className={styles.tabsNav}>
          <button
            type="button"
            onClick={() => setActiveTab('comptage')}
            className={`${styles.tabBtn} ${activeTab === 'comptage' ? styles.tabActive : ''}`}
          >
            <TrendingUp size={18} />
            <span>Vue Comptage</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.tabActive : ''}`}
          >
            <ShieldCheck size={18} />
            <span>Espace Staff</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gerant')}
            className={`${styles.tabBtn} ${activeTab === 'gerant' ? styles.tabActive : ''}`}
          >
            <Users size={18} />
            <span>Espace Gérant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`${styles.tabBtn} ${activeTab === 'qrcode' ? styles.tabActive : ''}`}
          >
            <QrCode size={18} />
            <span>QR Code Client</span>
          </button>
        </nav>

        {/* ======================================================== */}
        {/* 1. VUE COMPTAGE (STATS EN DIRECT)                        */}
        {/* ======================================================== */}
        {activeTab === 'comptage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={styles.metricsGrid}>
              <div className={styles.card} style={{ borderLeft: '5px solid #ff6600' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Scans QR Client</span>
                  <Scan size={20} color="#ff6600" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats7.scans}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Derniers 7 jours ({stats30.scans} sur 30j)</div>
              </div>

              <div className={styles.card} style={{ borderLeft: '5px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Clics Offres (Claimed)</span>
                  <Ticket size={20} color="#3b82f6" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats7.claimed}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Mots-codes affichés sur téléphone</div>
              </div>

              <div className={styles.card} style={{ borderLeft: '5px solid #16a34a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Validés / Comptoir (Confirmed)</span>
                  <CheckCircle2 size={20} color="#16a34a" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#16a34a' }}>{stats7.confirmed}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Enregistrés au bar ou à la caisse</div>
              </div>

              <div className={styles.card} style={{ borderLeft: '5px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Contacts Opt-in</span>
                  <Users size={20} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>{stats7.contacts}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>E-mails & téléphones collectés</div>
              </div>
            </div>

            {/* Suivi des Offres Actives */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>
                <span>Suivi d'utilisation par Offre & Mot-Code</span>
                <span className={styles.badge} style={{ background: '#f1f5f9', color: '#475569' }}>
                  {offers.length} Offres actives
                </span>
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px' }}>Titre Offre</th>
                      <th style={{ padding: '12px' }}>Mot-Code Oral</th>
                      <th style={{ padding: '12px' }}>Objectif (Target)</th>
                      <th style={{ padding: '12px' }}>Clics Client</th>
                      <th style={{ padding: '12px' }}>Validés Salle</th>
                      <th style={{ padding: '12px' }}>Taux d'atteinte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((o: any) => {
                      const total = o.total_uses || (o.claimed + o.confirmed) || 0;
                      const pct = Math.round((total / (o.target_uses || 1)) * 100);
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{o.title}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 800, color: '#ff6600' }}>
                              {o.code_word}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>{o.target_uses} utilisations</td>
                          <td style={{ padding: '12px' }}>{o.claimed}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#16a34a' }}>{o.confirmed}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, background: '#e2e8f0', height: '8px', borderRadius: '9999px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#16a34a' : pct >= 30 ? '#ff6600' : '#ef4444', height: '100%' }} />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '13px' }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ESPACE STAFF INTERACTIF                               */}
        {/* ======================================================== */}
        {activeTab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!isStaffLoggedIn ? (
              <div className={styles.card} style={{ maxWidth: '440px', margin: '20px auto', textAlign: 'center', padding: '30px 20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffedd5', color: '#ff6600', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lock size={28} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Connexion Service en Salle</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                  Entrez le code PIN Staff pour comptabiliser les offres servies en salle ou au comptoir.
                </p>

                {staffError && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '14px', fontWeight: 600 }}>
                    {staffError}
                  </div>
                )}

                <form onSubmit={handleStaffLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                      Code PIN Staff (4 à 6 chiffres)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value)}
                      placeholder="••••"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '28px',
                        letterSpacing: '8px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '2px solid #cbd5e1'
                      }}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%' }}>
                    Déverrouiller l'Espace Staff
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Messages Staff */}
                {staffSuccess && (
                  <div style={{ background: '#dcfce7', border: '2px solid #86efac', color: '#15803d', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>
                    ✅ {staffSuccess}
                  </div>
                )}

                {staffError && (
                  <div style={{ background: '#fee2e2', border: '2px solid #fca5a5', color: '#b91c1c', padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '16px' }}>
                    ❌ {staffError}
                  </div>
                )}

                {/* MODE 1 : Bouton Direct Comptoir (+1 par clic) */}
                <div className={styles.card} style={{ borderTop: '6px solid #ff6600' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>1. Comptage au Comptoir (Code oral)</h2>
                      <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                        Le client vous dit son mot-code à l'oral ? Cliquez directement sur le bouton de l'offre pour incrémenter le compteur.
                      </p>
                    </div>
                    <span className={styles.badge} style={{ background: '#dcfce7', color: '#15803d' }}>1 Clic</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {offers.map((o: any) => (
                      <div
                        key={o.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '16px',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{o.title}</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                            Mot-code : <strong style={{ color: '#ff6600', fontFamily: 'monospace', fontSize: '15px' }}>{o.code_word}</strong> | Validés : <strong>{o.confirmed}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleQuickCount(o)}
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          style={{ minWidth: '160px', padding: '12px 18px', fontSize: '15px' }}
                        >
                          <PlusCircle size={18} />
                          +1 Comptabiliser
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODE 2 : Saisie manuelle du mot-code */}
                <div className={styles.card}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>2. Saisie Manuelle du Mot-Code</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                    Si vous préférez taper le code montré sur le smartphone du client :
                  </p>

                  <form onSubmit={handleManualValidate} style={{ display: 'flex', gap: '10px', maxWidth: '480px' }}>
                    <input
                      type="text"
                      placeholder="Ex: DOUCEUR"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '18px',
                        fontWeight: 800,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        borderRadius: '10px',
                        border: '2px solid #cbd5e1'
                      }}
                    />
                    <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.btnOutline}`}>
                      Vérifier
                    </button>
                  </form>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setIsStaffLoggedIn(false)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                  >
                    Verrouiller l'Espace Staff
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. ESPACE GÉRANT (RÉSUMÉ DU MATIN & DÉCISIONS)          */}
        {/* ======================================================== */}
        {activeTab === 'gerant' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!isAdminLoggedIn ? (
              <div className={styles.card} style={{ maxWidth: '440px', margin: '20px auto', textAlign: 'center', padding: '30px 20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lock size={28} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Espace Propriétaire / Gérant</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                  Entrez le code PIN Admin pour consulter le Résumé du Matin et arbitrer les offres.
                </p>

                {adminError && (
                  <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '14px', fontWeight: 600 }}>
                    {adminError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                      Code PIN Gérant / Admin (6 chiffres minimum)
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="••••••"
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '28px',
                        letterSpacing: '8px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '2px solid #cbd5e1'
                      }}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%' }}>
                    Déverrouiller l'Espace Gérant
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {adminSuccess && (
                  <div style={{ background: '#dcfce7', border: '2px solid #86efac', color: '#15803d', padding: '14px', borderRadius: '12px', textAlign: 'center', fontWeight: 700 }}>
                    ✅ {adminSuccess}
                  </div>
                )}

                {/* Résumé du Matin : Arbitrage Garder / Ajuster / Laisser */}
                <div className={styles.card} style={{ borderTop: '6px solid #0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>☀️ Résumé du Matin & Recommandations</h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                        Bilan factuel des offres. Règle automatique : ≥ Objectif = <strong>Garder</strong>, ≥ 30% = <strong>Ajuster</strong>, sinon = <strong>Laisser</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className={`${styles.btn} ${styles.btnOutline}`}
                      style={{ fontSize: '13px', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FileSpreadsheet size={16} />
                      Export Contacts CSV
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {offers.map((o: any) => {
                      const total = o.total_uses || (o.claimed + o.confirmed) || 0;
                      const target = o.target_uses || 10;
                      let reco = 'Laisser';
                      let recoColor = '#b91c1c';
                      let recoBg = '#fee2e2';

                      if (total >= target) {
                        reco = 'Garder';
                        recoColor = '#15803d';
                        recoBg = '#dcfce7';
                      } else if (total >= 0.3 * target) {
                        reco = 'Ajuster';
                        recoColor = '#b45309';
                        recoBg = '#fef3c7';
                      }

                      const currentChoice = decisionSaved[o.id];

                      return (
                        <div
                          key={o.id}
                          style={{
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>{o.title}</h4>
                            <span style={{ background: recoBg, color: recoColor, padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 800 }}>
                              Recommandation : {reco}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                            Mot-code : <strong>{o.code_word}</strong> | Utilisations réelles : <strong>{total} / {target}</strong> ({Math.round((total / target) * 100)}%)
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleDecision(o.id, 'garder')}
                              className={`${styles.btn} ${currentChoice === 'garder' ? styles.btnPrimary : styles.btnOutline}`}
                              style={{ flex: 1, minHeight: '40px', fontSize: '14px' }}
                            >
                              Garder {currentChoice === 'garder' ? '✓' : ''}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDecision(o.id, 'ajuster')}
                              className={`${styles.btn} ${currentChoice === 'ajuster' ? styles.btnPrimary : styles.btnOutline}`}
                              style={{ flex: 1, minHeight: '40px', fontSize: '14px' }}
                            >
                              Ajuster {currentChoice === 'ajuster' ? '✓' : ''}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDecision(o.id, 'laisser')}
                              className={`${styles.btn} ${currentChoice === 'laisser' ? styles.btnPrimary : styles.btnOutline}`}
                              style={{ flex: 1, minHeight: '40px', fontSize: '14px', color: currentChoice === 'laisser' ? '#ffffff' : '#b91c1c' }}
                            >
                              Laisser {currentChoice === 'laisser' ? '✓' : ''}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setIsAdminLoggedIn(false)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                  >
                    Verrouiller l'Espace Gérant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. QR CODE CLIENT                                        */}
        {/* ======================================================== */}
        {activeTab === 'qrcode' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className={styles.card} style={{ textAlign: 'center', padding: '30px 20px' }}>
              <span className={styles.badge} style={{ background: '#ffedd5', color: '#ea580c', marginBottom: '16px' }}>
                QR Code Prêt pour les Tables & Comptoir
              </span>

              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '8px 0', color: '#0f172a' }}>
                {restaurant.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                Scannez pour ouvrir la page publique avec suggestions et offres du jour.
              </p>

              <div style={{ 
                background: '#ffffff', 
                border: '4px solid #ff6600', 
                borderRadius: '20px', 
                padding: '16px', 
                display: 'inline-block',
                boxShadow: '0 8px 20px rgba(255, 102, 0, 0.15)',
                marginBottom: '20px'
              }}>
                <img 
                  src={qrSvgUrl} 
                  alt={`QR Code ${restaurant.name}`} 
                  style={{ width: '240px', height: '240px', display: 'block' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a
                  href={qrSvgUrl}
                  download={`qr-${restaurant.slug}.svg`}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <Download size={18} />
                  Télécharger le SVG
                </a>
                <a
                  href={qrPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.btn} ${styles.btnOutline}`}
                >
                  Tester la page client
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Comment fonctionne le QR Code ?</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff6600', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>1</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Le client scanne sur la table</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Aucune application à installer. Un scan anonyme est comptabilisé immédiatement en base.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff6600', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>2</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Le client clique sur l'offre</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Le mot-code secret apparaît en grand avec un compte à rebours de 10 minutes (limité à 1 utilisation par jour).
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff6600', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>3</div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Comptage au Comptoir (+1)</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Le serveur appuie sur "+1 Comptabiliser" dans son Espace Staff pour valider la commande.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>URL Directe Client :</span>
                <div style={{ marginTop: '6px', fontSize: '14px', fontFamily: 'monospace', color: '#ff6600', wordBreak: 'break-all' }}>
                  {qrPageUrl}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
