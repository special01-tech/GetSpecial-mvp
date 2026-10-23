'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  Copy,
  Check,
  ExternalLink,
  Star,
  Phone,
  Globe,
  Loader2,
  FileCode,
  LayoutDashboard,
  Key
} from 'lucide-react';
import styles from './extractor.module.css';

export default function MapsExtractorPage() {
  const [mode, setMode] = useState<'search' | 'url'>('search');
  const [url, setUrl] = useState('');
  const [restaurantName, setRestaurantName] = useState('Makoomba');
  const [city, setCity] = useState('Cotonou');
  const [maxPlaces, setMaxPlaces] = useState(5);
  const [apifyToken, setApifyToken] = useState('');
  const [actorId, setActorId] = useState('compass/crawler-google-places');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [scrapingTarget, setScrapingTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'json' | 'raw'>('visual');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('apify_token');
      if (savedToken) setApifyToken(savedToken);
      const savedActor = localStorage.getItem('apify_actor');
      if (savedActor) setActorId(savedActor);
    }
  }, []);

  // Étape 1 : Recherche légère des occurrences
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (mode === 'url') {
      if (!url.trim()) {
        setError('Veuillez coller un lien Google Maps valide.');
        return;
      }
      return handleScrapePlace(url.trim(), restaurantName.trim());
    }

    if (!restaurantName.trim()) {
      setError('Veuillez renseigner le nom de l’établissement.');
      return;
    }

    setLoading(true);
    setError(null);
    setCandidates([]);
    setResult(null);

    try {
      const res = await fetch('/api/restaurant/scrape-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          restaurantName: restaurantName.trim(),
          city: city.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la recherche des lieux.');
      }

      setCandidates(json.candidates || []);
      if (!json.candidates || json.candidates.length === 0) {
        setError('Aucun établissement correspondant trouvé. Essayez de modifier le nom ou la ville.');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Scraping approfondi d'UNE SEULE FICHE validée
  const handleScrapePlace = async (targetUrlOrCandidate: string | any, placeName?: string) => {
    if (apifyToken.trim()) localStorage.setItem('apify_token', apifyToken.trim());
    if (actorId.trim()) localStorage.setItem('apify_actor', actorId.trim());

    const isCandidateObj = typeof targetUrlOrCandidate === 'object' && targetUrlOrCandidate !== null;
    const targetUrl = isCandidateObj ? targetUrlOrCandidate.mapsUrl : targetUrlOrCandidate;
    const candidateName = isCandidateObj ? targetUrlOrCandidate.name : (placeName || 'Restaurant');

    setLoading(true);
    setError(null);
    setScrapingTarget(candidateName);

    try {
      const res = await fetch('/api/restaurant/scrape-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scrape',
          url: targetUrl,
          restaurantName: candidateName,
          candidate: isCandidateObj ? targetUrlOrCandidate : undefined,
          city: isCandidateObj ? targetUrlOrCandidate.city : city.trim() || undefined,
          country: isCandidateObj ? targetUrlOrCandidate.country : undefined,
          address: isCandidateObj ? targetUrlOrCandidate.address : undefined,
          latitude: isCandidateObj ? targetUrlOrCandidate.latitude : undefined,
          longitude: isCandidateObj ? targetUrlOrCandidate.longitude : undefined,
          apifyToken: apifyToken.trim() || undefined,
          actorId: actorId.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors du scraping de la fiche.');
      }

      const resData = json.data || json;
      setResult(resData);
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue lors du scraping.');
    } finally {
      setLoading(false);
      setScrapingTarget(null);
    }
  };

  const handleCopyJson = (content: any) => {
    if (!content) return;
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentSelectedRestaurant = result?.restaurant;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        
        {/* En-tête */}
        <header className={styles.header}>
          <div className={styles.badge} style={{ background: '#dcfce7', color: '#15803d' }}>
            <span>Apify Google Places Économe (Sans IA)</span>
          </div>
          <h1 className={styles.title}>Extracteur Google Maps → Format GetSpecial</h1>
          <p className={styles.subtitle}>
            Extraction ciblée sur l’API Google Places : nous ne récupérons que les données <strong>strictement nécessaires</strong> au moteur GetSpecial pour réduire le temps de scraping et minimiser vos coûts.
          </p>
        </header>

        {/* Configuration Apify */}
        <div className={styles.card} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '12px' }}>
            <Key size={16} color="#ff6600" />
            <span>Configuration Apify</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                Votre Token API Apify :
              </label>
              <input
                type="password"
                value={apifyToken}
                onChange={(e) => setApifyToken(e.target.value)}
                placeholder="Ex: apify_api_..."
                className={styles.input}
                style={{ padding: '10px 14px', fontSize: '14px', background: '#ffffff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                Actor ID :
              </label>
              <input
                type="text"
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                placeholder="compass/crawler-google-places"
                className={styles.input}
                style={{ padding: '10px 14px', fontSize: '14px', background: '#ffffff' }}
              />
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            Retrouvez votre token sur <strong>apify.com/account/integrations</strong>. Il est mémorisé sur ce navigateur.
          </div>
        </div>

        {/* Formulaire de saisie : Mode Recherche (Nom + Ville) OU Mode URL */}
        <div className={styles.card}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`${styles.tabBtn} ${mode === 'search' ? styles.tabActive : ''}`}
              style={{ fontWeight: 700 }}
            >
              🔍 Recherche par Nom + Ville (Toutes les occurrences)
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`${styles.tabBtn} ${mode === 'url' ? styles.tabActive : ''}`}
              style={{ fontWeight: 700 }}
            >
              🔗 Lien Google Maps direct (URL)
            </button>
          </div>

          <form onSubmit={handleSearch} className={styles.inputGroup}>
            {mode === 'search' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nom de l'établissement :
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Ex: Makoomba"
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Ville / Commune :
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Cotonou"
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nom du restaurant (Optionnel) :
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Ex: Makoomba"
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Lien Google Maps direct :
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Collez ici votre lien Google Maps (ex: https://maps.app.goo.gl/...)"
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || (mode === 'url' ? !url.trim() : !restaurantName.trim())}
                className={styles.btnPrimary}
                style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{scrapingTarget ? `Scraping ciblé de « ${scrapingTarget} » en cours...` : 'Recherche légère en cours...'}</span>
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    <span>{mode === 'search' ? '🔍 Étape 1 : Rechercher les établissements correspondants' : '🔗 Extraire directement la fiche Google Maps'}</span>
                  </>
                )}
              </button>
            </div>

            <div className={styles.exampleRow}>
              <span>Raccourcis de test :</span>
              <button
                type="button"
                className={styles.exampleLink}
                onClick={() => {
                  setMode('search');
                  setRestaurantName('Makoomba');
                  setCity('Cotonou');
                }}
              >
                🍹 « Makoomba » Cotonou
              </button>
              <button
                type="button"
                className={styles.exampleLink}
                onClick={() => {
                  setMode('search');
                  setRestaurantName('Le Comptoir du Relais');
                  setCity('Paris');
                }}
              >
                🥐 « Le Comptoir du Relais » Paris
              </button>
              <button
                type="button"
                className={styles.exampleLink}
                onClick={() => {
                  setMode('url');
                  setRestaurantName('Makoomba');
                  setUrl('https://google.com/maps/place/Makoomba/@6.3536615,2.3846233,17z/data=!3m1!4b1!4m6!3m5!1s0x1023542ea4a6ed27:0x4a2103a2be7446aa!8m2!3d6.3536562!4d2.3871982!16s%2Fg%2F11b5pjt9c4');
                }}
              >
                🔗 Makoomba (Lien URL direct)
              </button>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <span>❌ {error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Étape 1 : Liste des occurrences trouvées après recherche */}
        {candidates.length > 0 && !result && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  📍 {candidates.length} établissement(s) trouvé(s)
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Sélectionnez votre restaurant pour lancer l’extraction complète (1 seule fiche, coût minimal).
                </p>
              </div>
              <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px' }}>
                Étape 1 validée (0 crédit dépensé)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {candidates.map((c: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>{c.name}</strong>
                      {c.rating && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: '6px' }}>
                          ⭐ {c.rating}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                      📍 {c.address || c.city || 'Adresse non renseignée'}
                    </div>
                    {c.latitude && c.longitude && (
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '12px' }}>
                        GPS : [{c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}]
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleScrapePlace(c)}
                    className={styles.btnPrimary}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: 800,
                      justifyContent: 'center',
                    }}
                  >
                    <span>🎯 C'est mon restaurant (Scraper les détails)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 : Zone de résultat final GetSpecial */}
        {result && (
          <div className={styles.card}>
            <div className={styles.tabsBar}>
              <button
                type="button"
                onClick={() => setActiveTab('visual')}
                className={`${styles.tabBtn} ${activeTab === 'visual' ? styles.tabActive : ''}`}
              >
                <LayoutDashboard size={16} />
                <span>Fiche Restaurant ({currentSelectedRestaurant?.name || 'Sélectionné'})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`${styles.tabBtn} ${activeTab === 'json' ? styles.tabActive : ''}`}
              >
                <FileCode size={16} />
                <span>Format GetSpecial</span>
              </button>
              {result.apifyRaw && (
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={`${styles.tabBtn} ${activeTab === 'raw' ? styles.tabActive : ''}`}
                >
                  <FileCode size={16} />
                  <span>Données Brutes Apify</span>
                </button>
              )}
            </div>

            {/* Avertissement de matching si le nom ne correspond pas */}
            {result.warning && (
              <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', color: '#92400e', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 700 }}>
                ⚠️ {result.warning}
              </div>
            )}

            {/* Données préparées avant envoi à Apify */}
            {result?.targetPrepared && (
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                  🛠️ Données Préparées & Paramètres Économiques
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <strong style={{ color: '#64748b' }}>Nom cible :</strong><br />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{result?.targetPrepared?.detectedName || 'Non spécifié'}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Coordonnées GPS réelles :</strong><br />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {currentSelectedRestaurant?.latitude && currentSelectedRestaurant?.longitude ? `${currentSelectedRestaurant.latitude}, ${currentSelectedRestaurant.longitude}` : (result?.targetPrepared?.coordinates ? `${result.targetPrepared.coordinates.lat}, ${result.targetPrepared.coordinates.lng}` : 'Non détectées')}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Identifiant Google CID :</strong><br />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{result?.targetPrepared?.cid || currentSelectedRestaurant?.googlePlaceId || 'Détecté'}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Économies activées :</strong><br />
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>0 avis • 1 photo • 1 lieu max</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'visual' && currentSelectedRestaurant && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 6px 0', color: '#0f172a' }}>
                      {currentSelectedRestaurant.name}
                    </h2>
                    <span style={{ fontSize: '12px', fontWeight: 700, background: result.extractionSource === 'apify' ? '#dcfce7' : '#ffedd5', color: result.extractionSource === 'apify' ? '#166534' : '#9a3412', padding: '3px 10px', borderRadius: '9999px' }}>
                      Source : {result.extractionSource === 'apify' ? 'Apify Google Places Optimisé' : 'Pipeline Local'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {currentSelectedRestaurant.rating && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '6px 12px', borderRadius: '10px', fontWeight: 800 }}>
                        <Star size={16} fill="#b45309" color="#b45309" />
                        {currentSelectedRestaurant.rating} {currentSelectedRestaurant.reviewsCount ? `(${currentSelectedRestaurant.reviewsCount} avis)` : ''}
                      </span>
                    )}
                    {currentSelectedRestaurant.priceRange && (
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '10px', fontWeight: 800 }}>
                        {currentSelectedRestaurant.priceRange}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.grid}>
                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Adresse</div>
                    <div className={styles.metricValue} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={18} color="#ff6600" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{typeof currentSelectedRestaurant.address === 'string' ? currentSelectedRestaurant.address : (currentSelectedRestaurant.address?.full || 'Non renseignée')}</span>
                    </div>
                  </div>

                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Catégories & Cuisine</div>
                    <div className={styles.metricValue}>
                      <div className={styles.tagList}>
                        {(currentSelectedRestaurant.categories || ['Non spécifié']).map((c: string, i: number) => (
                          <span key={i} className={styles.tag}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Contact & Liens</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', marginTop: '6px' }}>
                      {currentSelectedRestaurant.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} color="#64748b" />
                          <strong>{currentSelectedRestaurant.phone}</strong>
                        </span>
                      )}
                      {currentSelectedRestaurant.website && (
                        <a
                          href={currentSelectedRestaurant.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff6600', textDecoration: 'none', fontWeight: 600 }}
                        >
                          <Globe size={14} />
                          Site web officiel <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Services Détectés</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontSize: '13px', fontWeight: 700 }}>
                      <span style={{ color: currentSelectedRestaurant.hasTerrace ? '#16a34a' : '#64748b' }}>
                        {currentSelectedRestaurant.hasTerrace ? '☀️ Terrasse disponible' : '❌ Pas de terrasse'}
                      </span>
                      <span style={{ color: currentSelectedRestaurant.hasDelivery ? '#16a34a' : '#64748b' }}>
                        {currentSelectedRestaurant.hasDelivery ? '🛵 Livraison disponible' : '❌ Pas de livraison'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.metricCard}>
                    <div className={styles.metricLabel}>Localisation</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      Ville: <strong>{currentSelectedRestaurant.city || 'Non détectée'}</strong> ({currentSelectedRestaurant.country || 'FR'})
                      {currentSelectedRestaurant.latitude && (
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '2px' }}>
                          [{currentSelectedRestaurant.latitude}, {currentSelectedRestaurant.longitude}]
                        </div>
                      )}
                    </div>
                  </div>

                  {currentSelectedRestaurant.features && currentSelectedRestaurant.features.length > 0 && (
                    <div className={styles.metricCard} style={{ gridColumn: '1 / -1' }}>
                      <div className={styles.metricLabel}>Services & Caractéristiques Google (« À propos »)</div>
                      <div className={styles.tagList}>
                        {currentSelectedRestaurant.features.map((f: string, i: number) => (
                          <span key={i} style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentSelectedRestaurant.photoUrl && (
                    <div className={styles.metricCard} style={{ gridColumn: '1 / -1' }}>
                      <div className={styles.metricLabel}>Photo Principale de Couverture</div>
                      <div style={{ marginTop: '8px' }}>
                        <img
                          src={currentSelectedRestaurant.photoUrl}
                          alt="Photo de couverture"
                          style={{ maxHeight: '160px', borderRadius: '10px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'json' && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => handleCopyJson(currentSelectedRestaurant)}
                  className={styles.copyBtn}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#86efac" />
                      <span style={{ color: '#86efac' }}>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copier le JSON</span>
                    </>
                  )}
                </button>
                <pre className={styles.jsonViewer}>
                  {JSON.stringify(currentSelectedRestaurant, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'raw' && result.apifyRaw && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => handleCopyJson(result.apifyRaw)}
                  className={styles.copyBtn}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#86efac" />
                      <span style={{ color: '#86efac' }}>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copier le JSON Brut</span>
                    </>
                  )}
                </button>
                <pre className={styles.jsonViewer}>
                  {JSON.stringify(result.apifyRaw, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
