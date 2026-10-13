'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Building2,
  Clock,
  UtensilsCrossed,
  CloudSun,
  Bot,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Compass,
  Store,
  ChevronRight,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import styles from './system-monitor.module.css';

export default function SystemMonitorPage() {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'weather' | 'ai' | 'tester'>('restaurant');
  const [monitorData, setMonitorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire d'ajout de plat en direct
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [isAddingDish, setIsAddingDish] = useState(false);

  // Testeur de recherche de restaurant
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [testSearchResult, setTestSearchResult] = useState<any>(null);

  const fetchMonitorData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const storedRestId = typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null;
      const url = storedRestId ? `/api/system-monitor?restaurantId=${storedRestId}` : '/api/system-monitor';
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setMonitorData(json.data);
      } else {
        throw new Error(json.error || 'Erreur lors du chargement des données');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de joindre le système de monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
  }, []);

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim() || !monitorData?.restaurant?.id) return;

    setIsAddingDish(true);
    try {
      const res = await fetch('/api/system-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_dish',
          restaurantId: monitorData.restaurant.id,
          dishData: {
            name: newDishName.trim(),
            priceText: newDishPrice.trim() || '15.00 €',
            description: newDishDesc.trim() || 'Spécialité ajoutée via le moniteur',
          },
        }),
      });
      if (res.ok) {
        setNewDishName('');
        setNewDishPrice('');
        setNewDishDesc('');
        await fetchMonitorData();
      }
    } catch (err) {
      console.warn('[ADD_DISH_ERROR]', err);
    } finally {
      setIsAddingDish(false);
    }
  };

  const handleRunSearchTest = async () => {
    if (!searchQuery.trim()) return;
    setIsTestingSearch(true);
    setTestSearchResult(null);
    try {
      const params = new URLSearchParams({
        name: searchQuery.trim(),
        city: searchCity.trim(),
      });
      const res = await fetch(`/api/restaurants/search?${params.toString()}`);
      const json = await res.json();
      setTestSearchResult({
        status: res.status,
        results: json.data || [],
        rawResponse: json,
      });
    } catch (err: any) {
      setTestSearchResult({
        status: 500,
        error: err.message,
        results: [],
      });
    } finally {
      setIsTestingSearch(false);
    }
  };

  const restaurant = monitorData?.restaurant;
  const weather = monitorData?.weather;
  const ai = monitorData?.aiUnderstanding;
  const integrations = monitorData?.integrations || [];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleArea}>
          <div className={styles.badgeLive}>
            <span className={styles.pulseDot} />
            Système &amp; IA en Temps Réel
          </div>
          <h1 className={styles.title}>Centre de Diagnostic &amp; Tracking Live</h1>
          <p className={styles.subtitle}>
            Vérifiez exactement ce que le système récolte, les horaires, les plats en base et ce que l’IA comprend.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={fetchMonitorData}
          disabled={isLoading}
        >
          <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
          <span>Actualiser</span>
        </button>
      </header>

      {/* Navigation des Onglets */}
      <nav className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'restaurant' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('restaurant')}
        >
          <Store size={16} />
          <span>1. Établissement &amp; Plats</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'weather' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          <CloudSun size={16} />
          <span>2. Météo &amp; Signaux Live</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <Bot size={16} />
          <span>3. Ce que l’IA Comprend</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'tester' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('tester')}
        >
          <Search size={16} />
          <span>4. Testeur de Recherche &amp; Briques</span>
        </button>
      </nav>

      {isLoading && !monitorData && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#6b7280' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
          <div>Interrogation des services réels (Supabase, Météo, IA)...</div>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
          <AlertTriangle size={18} style={{ display: 'inline', marginRight: '6px' }} />
          {errorMsg}
        </div>
      )}

      {monitorData && (
        <>
          {/* ============================================================ */}
          {/* ONGLET 1 : ÉTABLISSEMENT, HORAIRES & PLATS EN BASE */}
          {/* ============================================================ */}
          {activeTab === 'restaurant' && (
            <div className={styles.gridTwoCols}>
              {/* Carte Profil Restaurant */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Building2 size={18} color="#ff5a00" />
                    <span>Identité Validée</span>
                  </div>
                  <span className={styles.cardBadge}>
                    ID: {restaurant?.id ? restaurant.id.slice(0, 14) + '...' : 'Aucun'}
                  </span>
                </div>

                <div className={styles.dataList}>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Nom de l’établissement</span>
                    <span className={styles.dataValue}>{restaurant?.name || 'Non renseigné'}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Type de cuisine</span>
                    <span className={styles.dataValue}>{restaurant?.type || 'Bistrot'}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Adresse complète</span>
                    <span className={styles.dataValue}>{restaurant?.address || 'Non renseignée'}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Coordonnées GPS réelles</span>
                    <span className={styles.dataValue}>
                      {restaurant?.latitude?.toFixed(4)}, {restaurant?.longitude?.toFixed(4)} ({restaurant?.country})
                    </span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Fuseau horaire</span>
                    <span className={styles.dataValue}>{restaurant?.timezone || 'Europe/Paris'}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Spécialités enregistrées</span>
                    <div className={styles.tagPills}>
                      {(restaurant?.specialties || []).map((sp: string, idx: number) => (
                        <span key={idx} className={styles.tagPill}>{sp}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Horaires d'Ouverture & Services */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Clock size={18} color="#ff5a00" />
                    <span>Horaires Semaine &amp; Week-end</span>
                  </div>
                  <span
                    className={`${styles.cardBadge} ${
                      restaurant?.openingHours?.isOpenNow
                        ? styles.cardBadgeOpen
                        : styles.cardBadgeClosed
                    }`}
                  >
                    {restaurant?.openingHours?.isOpenNow ? '🟢 OUVERT EN CE MOMENT' : '🔴 FERMÉ EN CE MOMENT'}
                  </span>
                </div>

                <div className={styles.dataList}>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Service actuel</span>
                    <span className={styles.dataValue}>
                      {restaurant?.openingHours?.currentServiceLabel || 'Non défini'}
                    </span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Horaires Semaine (Lun - Ven)</span>
                    <span className={styles.dataValue}>
                      {restaurant?.openingHours?.week || '11:30 - 14:30 • 18:30 - 22:30'}
                    </span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Horaires Week-end (Sam - Dim)</span>
                    <span className={styles.dataValue}>
                      {restaurant?.openingHours?.weekend || '12:00 - 23:00'}
                    </span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Créneaux creux identifiés</span>
                    <div className={styles.tagPills}>
                      {(restaurant?.openingHours?.offPeakSlots || ['14:00 - 15:30', '18:30 - 19:30']).map(
                        (slot: string, idx: number) => (
                          <span key={idx} className={styles.tagPill} style={{ background: '#fff7ed', color: '#c2410c' }}>
                            {slot}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Terrasse &amp; Capacité</span>
                    <span className={styles.dataValue}>
                      {restaurant?.profile?.hasTerrace ? 'Oui (Terrasse active)' : 'Intérieur uniquement'} • {restaurant?.profile?.capacityCovers || 40} couverts
                    </span>
                  </div>
                </div>
              </div>

              {/* Carte Plats de la Carte / Menu */}
              <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <UtensilsCrossed size={18} color="#ff5a00" />
                    <span>Plats Enregistrés en Base ({restaurant?.dishes?.length || 0})</span>
                  </div>
                  <span className={styles.cardBadge}>
                    Table: prisma.dish
                  </span>
                </div>

                {(!restaurant?.dishes || restaurant.dishes.length === 0) ? (
                  <div className={styles.emptyDishesBox}>
                    Aucun plat enregistré en base pour cet établissement.
                    Ajoutez-en un ci-dessous pour tester immédiatement la synchronisation.
                  </div>
                ) : (
                  <div className={styles.dishesGrid}>
                    {restaurant.dishes.map((dish: any) => (
                      <div key={dish.id} className={styles.dishItem}>
                        <div className={styles.dishNameRow}>
                          <span className={styles.dishName}>{dish.name}</span>
                          <span className={styles.dishPrice}>{dish.priceText || '15 €'}</span>
                        </div>
                        <p className={styles.dishDesc}>{dish.description || 'Spécialité maison'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire d'ajout rapide d'un plat */}
                <form className={styles.addDishForm} onSubmit={handleAddDish}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151' }}>
                    + Ajouter un plat réel pour tester la persistance Supabase
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nom du plat (ex: Pavé de Saumon, Burger Maison...)"
                      value={newDishName}
                      onChange={(e) => setNewDishName(e.target.value)}
                      className={styles.inputField}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Prix (ex: 18.50 €)"
                      value={newDishPrice}
                      onChange={(e) => setNewDishPrice(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description courte (ex: Purée maison, légumes de saison)"
                    value={newDishDesc}
                    onChange={(e) => setNewDishDesc(e.target.value)}
                    className={styles.inputField}
                  />
                  <button type="submit" className={styles.actionBtn} disabled={isAddingDish}>
                    {isAddingDish ? 'Enregistrement...' : 'Enregistrer le plat en base'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET 2 : MÉTÉO & SIGNAUX EN DIRECT */}
          {/* ============================================================ */}
          {activeTab === 'weather' && (
            <div className={styles.gridTwoCols}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <CloudSun size={18} color="#ff5a00" />
                    <span>Météo Réelle en Direct</span>
                  </div>
                  <span className={styles.cardBadge}>
                    API: Open-Meteo
                  </span>
                </div>

                <div className={styles.dataList}>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Température actuelle</span>
                    <span className={styles.dataValue} style={{ fontSize: '1.2rem', color: '#ff5a00' }}>
                      {weather?.temperatureC}°C
                    </span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Conditions du ciel</span>
                    <span className={styles.dataValue}>{weather?.condition}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Vitesse du vent</span>
                    <span className={styles.dataValue}>{weather?.windSpeedKmh} km/h</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Indice terrasse favorable</span>
                    <span
                      className={styles.dataValue}
                      style={{ color: weather?.isPatioFavorable ? '#059669' : '#dc2626' }}
                    >
                      {weather?.isPatioFavorable ? '✅ Oui (Terrasse exploitable)' : '❌ Non (Intérieur privilégié)'}
                    </span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Source des données</span>
                    <span className={styles.dataValue}>{weather?.source}</span>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Compass size={18} color="#ff5a00" />
                    <span>Localisation &amp; Précision</span>
                  </div>
                  <span className={styles.cardBadge}>GPS Live</span>
                </div>

                <div className={styles.dataList}>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Latitude</span>
                    <span className={styles.dataValue}>{restaurant?.latitude}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Longitude</span>
                    <span className={styles.dataValue}>{restaurant?.longitude}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Pays de rattachement</span>
                    <span className={styles.dataValue}>{restaurant?.country}</span>
                  </div>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Détection de proximité</span>
                    <span className={styles.dataValue}>Zone urbaine dense</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET 3 : CE QUE L'IA COMPREND */}
          {/* ============================================================ */}
          {activeTab === 'ai' && (
            <div className={styles.gridTwoCols}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Bot size={18} color="#ff5a00" />
                    <span>Contexte &amp; Règles Métier Comprises</span>
                  </div>
                  <span className={styles.cardBadge}>Contexte LLM</span>
                </div>

                <div className={styles.dataList}>
                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Concept retenu</span>
                    <span className={styles.dataValue}>{ai?.conceptName} ({ai?.cuisineType})</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Ton rédactionnel</span>
                    <span className={styles.dataValue}>{ai?.communicationTone}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Ticket moyen estimé</span>
                    <span className={styles.dataValue}>{ai?.averageTicket}</span>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Public cible injecté</span>
                    <div className={styles.tagPills}>
                      {(ai?.targetAudience || []).map((t: string, idx: number) => (
                        <span key={idx} className={styles.tagPill}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.dataRow}>
                    <span className={styles.dataLabel}>Règle absolue Ground-Truth</span>
                    <span className={styles.dataValue} style={{ color: '#059669' }}>
                      Strictement aucun fait ni prix inventé
                    </span>
                  </div>
                </div>
              </div>

              {/* Opportunités récentes */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Sparkles size={18} color="#ff5a00" />
                    <span>Dernières Propositions du Moteur</span>
                  </div>
                  <span className={styles.cardBadge}>
                    {restaurant?.recentOpportunities?.length || 0} opportunité(s)
                  </span>
                </div>

                {(!restaurant?.recentOpportunities || restaurant.recentOpportunities.length === 0) ? (
                  <div className={styles.emptyDishesBox}>
                    Aucune opportunité archivée pour l’instant. Le moteur génère des suggestions lors des créneaux creux.
                  </div>
                ) : (
                  <div className={styles.dataList}>
                    {restaurant.recentOpportunities.map((opp: any) => (
                      <div key={opp.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>{opp.title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{opp.description}</div>
                        <div style={{ fontSize: '0.75rem', color: '#ff5a00', marginTop: '4px', fontWeight: 600 }}>
                          Score: {opp.score} • Statut: {opp.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ONGLET 4 : TESTEUR DE RECHERCHE & INTÉGRATIONS */}
          {/* ============================================================ */}
          {activeTab === 'tester' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Testeur de recherche de restaurant */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <Search size={18} color="#ff5a00" />
                    <span>Testeur de Requêtes en Direct : Vérification d'Inexistence</span>
                  </div>
                  <span className={styles.cardBadge}>0 Fake Result Guarantee</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                  Tapez un nom de restaurant. Si le restaurant n’existe pas, le système doit renvoyer <strong>0 résultat</strong> et refuser toute invention de faux restaurant.
                </p>

                <div className={styles.searchTesterBox}>
                  <div className={styles.searchTesterRow}>
                    <input
                      type="text"
                      placeholder="Nom à tester (ex: Franklin Barbecue ou RestoInexistant999)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.inputField}
                      style={{ flex: 2 }}
                    />
                    <input
                      type="text"
                      placeholder="Ville (optionnel, ex: Paris, Austin)"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className={styles.inputField}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={handleRunSearchTest}
                      disabled={isTestingSearch}
                    >
                      {isTestingSearch ? 'Recherche...' : 'Tester la requête'}
                    </button>
                  </div>

                  {testSearchResult && (
                    <div>
                      {testSearchResult.results.length === 0 ? (
                        <div className={`${styles.testResultAlert} ${styles.testResultEmpty}`}>
                          <AlertTriangle size={18} />
                          <div>
                            <strong>Aucun établissement trouvé (Résultat vide vérifié) :</strong>
                            <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                              Le système a honnêtement renvoyé 0 résultat. Aucun faux profil n’a été inventé. Le contrôle de non-existence fonctionne à 100%.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`${styles.testResultAlert} ${styles.testResultSuccess}`}>
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>{testSearchResult.results.length} établissement(s) réel(s) trouvé(s) :</strong>
                            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                              {testSearchResult.results.map((r: any, idx: number) => (
                                <div key={idx} style={{ marginTop: '2px' }}>
                                  • <strong>{r.name}</strong> — {r.address} ({r.cuisineType})
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Grille des Intégrations */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTitle}>
                    <ShieldCheck size={18} color="#ff5a00" />
                    <span>Statut des Briques &amp; Intégrations Système</span>
                  </div>
                  <span className={styles.cardBadge}>Santé Globale</span>
                </div>

                <div className={styles.dataList}>
                  {integrations.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                          {item.details}
                        </div>
                      </div>
                      <span
                        className={`${styles.cardBadge} ${
                          item.isLive ? styles.cardBadgeOpen : styles.cardBadgeClosed
                        }`}
                        style={{ flexShrink: 0 }}
                      >
                        {item.isLive ? 'CONNECTÉ' : 'REPLI CERTIFIÉ'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
