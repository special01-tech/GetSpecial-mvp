'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UtensilsCrossed,
  Search,
  LayoutGrid,
  List as ListIcon,
  Star,
  Check,
  X,
} from 'lucide-react';
import OfferCard from '@/components/ui/OfferCard/OfferCard';
import OfferForm from '@/components/ui/OfferForm/OfferForm';
import MenuManager from '@/components/ui/MenuManager/MenuManager';
import { useLanguage } from '@/i18n';
import {
  RestaurantOffer,
  RestaurantMenuData,
} from '@/services/restaurant/restaurant-offers.data';
import styles from './offers.module.css';

interface NoticeState {
  text: string;
  type: 'success' | 'error';
}

/**
 * Mon Resto — Plats ou Offres (/dashboard/restaurant/offers)
 * Connecté intégralement aux vraies données en base (/api/offers & /api/restaurants/[id]/dishes).
 */
export default function RestaurantOffersPage() {
  const { t } = useLanguage();
  const [restaurantName, setRestaurantName] = useState('Mon Restaurant');
  const [offers, setOffers] = useState<RestaurantOffer[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);
  const [menuSummary, setMenuSummary] = useState<string>('');
  const [menuMetadata, setMenuMetadata] = useState<RestaurantMenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTabSection, setActiveTabSection] = useState<'dishes' | 'offers'>('offers');

  const [dishSearch, setDishSearch] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('all');
  const [dishesViewMode, setDishesViewMode] = useState<'list' | 'grid'>('list');

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<RestaurantOffer | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // Chargement réel des offres et des plats depuis l'API
  useEffect(() => {
    let cancelled = false;
    const restaurantId =
      (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
      'current';

    async function loadAllData() {
      setIsLoading(true);
      try {
        const [profileRes, dishesRes, offersRes] = await Promise.all([
          fetch(`/api/restaurants/${restaurantId}/profile`),
          fetch(`/api/restaurants/${restaurantId}/dishes`),
          fetch(`/api/offers?restaurantId=${encodeURIComponent(restaurantId)}`),
        ]);

        const [profileJson, dishesJson, offersJson] = await Promise.all([
          profileRes.json().catch(() => null),
          dishesRes.json().catch(() => null),
          offersRes.json().catch(() => null),
        ]);

        if (cancelled) return;

        if (profileRes.ok && profileJson?.success && profileJson.data) {
          if (profileJson.data.id) {
            localStorage.setItem('getspecial_restaurant_id', profileJson.data.id);
          }
          if (profileJson.data.name) {
            setRestaurantName(profileJson.data.name);
          }
        }

        let loadedDishesCount = 0;
        if (dishesRes.ok && dishesJson?.success && dishesJson.data) {
          const remoteDishes = Array.isArray(dishesJson.data.dishes) ? dishesJson.data.dishes : [];
          loadedDishesCount = remoteDishes.length;
          setDishes(remoteDishes);
          setMenuSummary(dishesJson.data.rawSummary || '');
          setMenuMetadata(dishesJson.data.menuMetadata || null);
          localStorage.setItem('getspecial_restaurant_dishes', JSON.stringify(remoteDishes));
        }

        if (offersRes.ok && offersJson?.success && Array.isArray(offersJson.data)) {
          setOffers(offersJson.data);
          localStorage.setItem('getspecial_restaurant_offers', JSON.stringify(offersJson.data));
          if (loadedDishesCount > 0) {
            setActiveTabSection('dishes');
          } else {
            setActiveTabSection('offers');
          }
        } else if (!offersRes.ok) {
          console.error('[OFFERS_LOAD_ERROR]', offersRes.status, offersJson);
          showNotice('Impossible de charger vos offres enregistrées.', 'error');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[OFFERS_PAGE_NETWORK_ERROR]', err);
          showNotice('Connexion au serveur indisponible.', 'error');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAllData();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncOffersCache = (nextOffers: RestaurantOffer[]) => {
    setOffers(nextOffers);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_offers', JSON.stringify(nextOffers));
    }
  };

  // 1. Créer ou Modifier une offre en base de données
  const handleSaveOffer = async (offerToSave: RestaurantOffer): Promise<boolean> => {
    const restaurantId =
      (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
      'current';

    try {
      if (editingOffer) {
        const res = await fetch('/api/offers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: offerToSave.id,
            name: offerToSave.name,
            description: offerToSave.description,
            discount: offerToSave.discount,
            period: offerToSave.period,
            status: offerToSave.status,
            image: offerToSave.image || null,
            platforms: offerToSave.platforms,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || !json?.data) {
          if (res.status >= 400 && res.status < 500 && json?.error) {
            showNotice(json.error, 'error');
          } else {
            console.error('[OFFER_PATCH_ERROR]', res.status, json);
            showNotice('Impossible d’enregistrer les modifications de cette offre.', 'error');
          }
          return false;
        }

        const updatedList = offers.map((o) => (o.id === offerToSave.id ? json.data : o));
        syncOffersCache(updatedList);
        showNotice(`Offre « ${json.data.name} » mise à jour.`, 'success');
      } else {
        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            name: offerToSave.name,
            description: offerToSave.description,
            discount: offerToSave.discount,
            period: offerToSave.period,
            status: offerToSave.status,
            image: offerToSave.image,
            platforms: offerToSave.platforms,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || !json?.data) {
          if (res.status >= 400 && res.status < 500 && json?.error) {
            showNotice(json.error, 'error');
          } else {
            console.error('[OFFER_POST_ERROR]', res.status, json);
            showNotice('Impossible de créer cette offre pour le moment.', 'error');
          }
          return false;
        }

        syncOffersCache([json.data, ...offers]);
        showNotice(`Offre « ${json.data.name} » créée.`, 'success');
      }

      setIsOfferModalOpen(false);
      setEditingOffer(null);
      return true;
    } catch (err) {
      console.error('[OFFER_SAVE_NETWORK_ERROR]', err);
      showNotice('Connexion interrompue. Votre offre n’a pas pu être enregistrée.', 'error');
      return false;
    }
  };

  // 2. Ouvrir en mode édition
  const handleEdit = (offer: RestaurantOffer) => {
    setEditingOffer(offer);
    setIsOfferModalOpen(true);
  };

  // 3. Supprimer réellement une offre en base
  const handleDelete = async (id: string) => {
    const target = offers.find((o) => o.id === id);
    try {
      const res = await fetch(`/api/offers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        console.error('[OFFER_DELETE_ERROR]', res.status, json);
        showNotice('Impossible de supprimer cette offre pour le moment.', 'error');
        return;
      }

      syncOffersCache(offers.filter((o) => o.id !== id));
      showNotice(`Offre « ${target?.name || ''} » supprimée.`, 'success');
    } catch (err) {
      console.error('[OFFER_DELETE_NETWORK_ERROR]', err);
      showNotice('Impossible de joindre le serveur pour supprimer cette offre.', 'error');
    }
  };

  // 4. Toggle statut réel en base (Actif <-> En pause)
  const handleToggleStatus = async (id: string) => {
    const target = offers.find((o) => o.id === id);
    if (!target) return;
    const nextStatus: RestaurantOffer['status'] = target.status === 'active' ? 'draft' : 'active';

    try {
      const res = await fetch('/api/offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        console.error('[OFFER_TOGGLE_STATUS_ERROR]', res.status, json);
        showNotice('Le changement de statut n’a pas pu être enregistré.', 'error');
        return;
      }

      const updated = offers.map((o) => (o.id === id ? json.data : o));
      syncOffersCache(updated);
      showNotice(
        nextStatus === 'active'
          ? `Offre « ${target.name} » activée.`
          : `Offre « ${target.name} » mise en pause.`,
        'success'
      );
    } catch (err) {
      console.error('[OFFER_TOGGLE_NETWORK_ERROR]', err);
      showNotice('Connexion interrompue lors du changement de statut.', 'error');
    }
  };

  // 5. Persister en base les formules extraites automatiquement du menu
  const handleImportExtractedOffers = async (newOffers: RestaurantOffer[]) => {
    if (!newOffers.length) return;
    const restaurantId =
      (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
      'current';

    const createdOffers: RestaurantOffer[] = [];
    for (const item of newOffers) {
      try {
        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            name: item.name,
            description:
              item.description && item.description.length >= 3
                ? item.description
                : `Formule à la carte : ${item.name}`,
            discount: item.discount,
            period: item.period || 'Toute la semaine',
            status: 'active',
            platforms: item.platforms || ['instagram', 'facebook'],
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && json.data) {
          createdOffers.push(json.data);
        }
      } catch (err) {
        console.error('[MENU_OFFER_PERSIST_ERROR]', err);
      }
    }

    if (createdOffers.length > 0) {
      setOffers((prev) => {
        const merged = [...createdOffers, ...prev];
        if (typeof window !== 'undefined') {
          localStorage.setItem('getspecial_restaurant_offers', JSON.stringify(merged));
        }
        return merged;
      });
    }
  };

  // 6. Callback après extraction complète par MenuManager
  const handleMenuExtracted = (result: {
    dishes: any[];
    extractedOffers: any[];
    rawSummary?: string;
    menuMetadata?: RestaurantMenuData;
  }) => {
    if (Array.isArray(result.dishes)) {
      setDishes(result.dishes);
      setDishSearch('');
      setDishCategoryFilter('all');
      if (typeof window !== 'undefined') {
        localStorage.setItem('getspecial_restaurant_dishes', JSON.stringify(result.dishes));
      }
    }

    if (result.rawSummary !== undefined) {
      setMenuSummary(result.rawSummary);
    }

    if (result.menuMetadata) {
      setMenuMetadata(result.menuMetadata);
    }

    if (Array.isArray(result.extractedOffers) && result.extractedOffers.length > 0) {
      const formatted: RestaurantOffer[] = result.extractedOffers.map((o: any, idx: number) => ({
        id: `off_menu_${Date.now()}_${idx}`,
        name: o.name,
        description: o.description || `Formule : ${o.name}`,
        discount: o.discount || '',
        period: o.period || 'Toute la semaine',
        status: 'active',
        platforms: ['instagram', 'facebook'],
      }));
      handleImportExtractedOffers(formatted);
    }

    setActiveTabSection('dishes');
  };

  const handleMenuCleared = () => {
    setDishes([]);
    setMenuSummary('');
    setMenuMetadata(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('getspecial_restaurant_dishes');
      localStorage.removeItem('getspecial_restaurant_menu_summary');
    }
  };

  // Détecte quels plats ont déjà été promus en offre (sur la base du titre réel en DB)
  const promotedDishNames = useMemo(() => {
    return new Set(
      offers.map((o) => o.name.replace(/^Spécialité\s*:\s*/i, '').trim().toLowerCase())
    );
  }, [offers]);

  // 7. Promouvoir un plat individuel en offre principale persistée en DB
  const handlePromoteDishToOffer = async (dish: any) => {
    if (promotedDishNames.has(String(dish.name || '').trim().toLowerCase())) return;

    const newOffer: RestaurantOffer = {
      id: `off_dish_${Date.now()}`,
      name: `Spécialité : ${dish.name}`,
      description: dish.description || `Découvrez notre plat à la carte : ${dish.name}`,
      discount: dish.price || dish.priceText || 'À la carte',
      period: 'Toute la semaine',
      status: 'active',
      platforms: ['instagram', 'facebook'],
    };

    await handleSaveOffer(newOffer);
  };

  // Rubriques uniques détectées parmi les plats
  const availableCategories: string[] = useMemo(() => {
    return Array.from(
      new Set(dishes.map((d: any) => (d.category || '').trim()).filter(Boolean))
    );
  }, [dishes]);

  // Plats filtrés par recherche et catégorie
  const filteredDishes = useMemo(() => {
    const q = dishSearch.toLowerCase().trim();
    return dishes.filter((dish: any) => {
      const matchesSearch =
        !q ||
        (dish.name && dish.name.toLowerCase().includes(q)) ||
        (dish.description && dish.description.toLowerCase().includes(q)) ||
        (dish.category && dish.category.toLowerCase().includes(q));

      const matchesCategory =
        dishCategoryFilter === 'all' || dish.category === dishCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [dishes, dishSearch, dishCategoryFilter]);

  const activeCount = offers.filter((o) => o.status === 'active').length;

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <h1 className={styles.pageMainTitle}>Mon Resto</h1>
            <p className={styles.pageMainSubtitle}>
              Gérez votre carte, vos plats et vos offres réelles pour alimenter les campagnes IA.
            </p>
          </div>
        </header>

        {/* Bannière de retour honnête */}
        {notice && (
          <div
            className={`${styles.savedNotice} ${
              notice.type === 'error' ? styles.errorNotice : ''
            }`}
            role="status"
          >
            {notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* ONGLETS INTERNES DE NAVIGATION */}
        <nav className={styles.tabsNav} aria-label={t('restaurant.tabs.label')}>
          <Link href="/dashboard/restaurant" className={styles.tabBtn}>
            <Store size={15} />
            <span>Profil de l’établissement</span>
          </Link>

          <Link
            href="/dashboard/restaurant/offers"
            className={`${styles.tabBtn} ${styles.tabActive}`}
          >
            <Tag size={15} />
            <span>Plats ou Offres</span>
          </Link>

          <Link href="/dashboard/restaurant/events" className={styles.tabBtn}>
            <Calendar size={15} />
            <span>Événements locaux</span>
          </Link>
        </nav>

        <main className={styles.mainContent}>
          {/* 1. MODULE CARTE & MENU (PDF & Images uniquement) */}
          <MenuManager
            restaurantName={restaurantName}
            initialMenu={menuMetadata}
            onImportOffers={handleImportExtractedOffers}
            onNotice={showNotice}
            onMenuExtracted={handleMenuExtracted}
            onMenuCleared={handleMenuCleared}
          />

          {/* 2. SECTION PLATS OU OFFRES DU RESTAURANT */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2 className={styles.tabSectionTitle}>Plats ou Offres</h2>
                <p className={styles.tabSectionSubtitle}>
                  {dishes.length} plat{dishes.length > 1 ? 's' : ''} à la carte • {activeCount}{' '}
                  offre{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} sur{' '}
                  {offers.length} au total.
                </p>
              </div>

              <div className={styles.headerActions}>
                {activeTabSection === 'offers' ? (
                  <>
                    <Link href="/dashboard/create?type=offer" className={styles.studioLinkBtn}>
                      <Sparkles size={14} strokeWidth={1.75} />
                      <span>Promouvoir au Studio</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingOffer(null);
                        setIsOfferModalOpen(true);
                      }}
                      className={styles.addOfferBtn}
                    >
                      <Plus size={15} />
                      <span>Nouvelle offre</span>
                    </button>
                  </>
                ) : (
                  <div className={styles.viewModeToggle}>
                    <button
                      type="button"
                      className={`${styles.viewModeBtn} ${
                        dishesViewMode === 'list' ? styles.viewModeBtnActive : ''
                      }`}
                      onClick={() => setDishesViewMode('list')}
                      title="Affichage en liste"
                    >
                      <ListIcon size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.viewModeBtn} ${
                        dishesViewMode === 'grid' ? styles.viewModeBtnActive : ''
                      }`}
                      onClick={() => setDishesViewMode('grid')}
                      title="Affichage en grille"
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {menuSummary && (
              <div className={styles.summaryBanner}>
                <span>
                  <strong>Positionnement culinaire :</strong> {menuSummary}
                </span>
              </div>
            )}

            <div className={styles.sectionTabsRow}>
              <button
                type="button"
                className={`${styles.sectionTabBtn} ${
                  activeTabSection === 'dishes' ? styles.sectionTabBtnActive : ''
                }`}
                onClick={() => setActiveTabSection('dishes')}
              >
                <UtensilsCrossed size={15} />
                <span>Plats de la carte ({dishes.length})</span>
              </button>

              <button
                type="button"
                className={`${styles.sectionTabBtn} ${
                  activeTabSection === 'offers' ? styles.sectionTabBtnActive : ''
                }`}
                onClick={() => setActiveTabSection('offers')}
              >
                <Tag size={15} />
                <span>Offres & Formules ({offers.length})</span>
              </button>
            </div>

            {/* VUE 1 : PLATS DE LA CARTE */}
            {activeTabSection === 'dishes' && (
              <>
                {isLoading ? (
                  <div className={styles.emptyBox}>
                    <p className={styles.emptyText}>Chargement de votre carte...</p>
                  </div>
                ) : dishes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className={styles.dishesToolbar}>
                      <div className={styles.dishesToolbarTop}>
                        <div className={styles.dishSearchBox}>
                          <Search size={14} color="#9CA3AF" />
                          <input
                            type="text"
                            placeholder="Rechercher un plat, ingrédient..."
                            value={dishSearch}
                            onChange={(e) => setDishSearch(e.target.value)}
                            className={styles.dishSearchInput}
                          />
                          {dishSearch && (
                            <button
                              type="button"
                              onClick={() => setDishSearch('')}
                              className={styles.clearSearchBtn}
                              aria-label="Effacer la recherche"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {availableCategories.length > 0 && (
                        <div className={styles.categoryPillsRow}>
                          <button
                            type="button"
                            className={`${styles.categoryPill} ${
                              dishCategoryFilter === 'all' ? styles.categoryPillActive : ''
                            }`}
                            onClick={() => setDishCategoryFilter('all')}
                          >
                            Tous ({dishes.length})
                          </button>
                          {availableCategories.map((cat) => {
                            const count = dishes.filter((d: any) => d.category === cat).length;
                            return (
                              <button
                                key={cat}
                                type="button"
                                className={`${styles.categoryPill} ${
                                  dishCategoryFilter === cat ? styles.categoryPillActive : ''
                                }`}
                                onClick={() => setDishCategoryFilter(cat)}
                              >
                                {cat} ({count})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {filteredDishes.length === 0 ? (
                      <div className={styles.emptyBox}>
                        <p className={styles.emptyText}>
                          Aucun plat ne correspond à « {dishSearch} ».
                        </p>
                      </div>
                    ) : dishesViewMode === 'list' ? (
                      <div className={styles.dishesList}>
                        {filteredDishes.map((dish: any) => {
                          const displayPrice = dish.price || dish.priceText || '';
                          const isPromoted = promotedDishNames.has(
                            String(dish.name || '').trim().toLowerCase()
                          );
                          return (
                            <div key={dish.id || dish.name} className={styles.dishListItem}>
                              <div className={styles.dishListMain}>
                                <div className={styles.dishListTitleRow}>
                                  <h4 className={styles.dishName}>{dish.name}</h4>
                                  {dish.category && (
                                    <span className={styles.dishCategory}>{dish.category}</span>
                                  )}
                                  {dish.isSignature && (
                                    <span className={styles.signatureBadge}>
                                      <Star size={11} fill="#D97706" />
                                      <span>Signature</span>
                                    </span>
                                  )}
                                </div>
                                {dish.description && (
                                  <p className={styles.dishDesc}>{dish.description}</p>
                                )}
                              </div>

                              <div className={styles.dishListRight}>
                                {displayPrice && (
                                  <span className={styles.dishPrice}>{displayPrice}</span>
                                )}
                                {isPromoted ? (
                                  <span className={styles.dishPromotedBadge}>
                                    <Check size={13} strokeWidth={2.5} />
                                    <span>Offre active</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.dishPromoteBtn}
                                    onClick={() => handlePromoteDishToOffer(dish)}
                                  >
                                    <Plus size={13} />
                                    <span>Créer une offre</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={styles.dishesGrid}>
                        {filteredDishes.map((dish: any) => {
                          const displayPrice = dish.price || dish.priceText || '';
                          const isPromoted = promotedDishNames.has(
                            String(dish.name || '').trim().toLowerCase()
                          );
                          return (
                            <div key={dish.id || dish.name} className={styles.dishCard}>
                              <div>
                                <div className={styles.dishCardHeader}>
                                  <h4 className={styles.dishName}>{dish.name}</h4>
                                  {displayPrice && (
                                    <span className={styles.dishPrice}>{displayPrice}</span>
                                  )}
                                </div>
                                <div className={styles.dishCardBadges}>
                                  {dish.category && (
                                    <span className={styles.dishCategory}>{dish.category}</span>
                                  )}
                                  {dish.isSignature && (
                                    <span className={styles.signatureBadge}>
                                      <Star size={11} fill="#D97706" />
                                      <span>Signature</span>
                                    </span>
                                  )}
                                </div>
                                {dish.description && (
                                  <p className={styles.dishDesc}>{dish.description}</p>
                                )}
                              </div>
                              <div className={styles.dishCardFooter}>
                                {isPromoted ? (
                                  <span className={styles.dishPromotedBadge}>
                                    <Check size={13} strokeWidth={2.5} />
                                    <span>Offre active</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    className={styles.dishPromoteBtn}
                                    onClick={() => handlePromoteDishToOffer(dish)}
                                  >
                                    <Plus size={13} />
                                    <span>Créer une offre</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyIconCircle}>
                      <UtensilsCrossed size={24} />
                    </div>
                    <h3 className={styles.emptyTitle}>Aucun plat à la carte pour le moment</h3>
                    <p className={styles.emptyText}>
                      Importez la carte ou l’ardoise de votre restaurant ci-dessus (PDF ou photo).
                      L’IA extraira automatiquement vos plats, rubriques et tarifs.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* VUE 2 : OFFRES & FORMULES DU RESTAURANT */}
            {activeTabSection === 'offers' && (
              <>
                {isLoading ? (
                  <div className={styles.emptyBox}>
                    <p className={styles.emptyText}>Chargement de vos offres...</p>
                  </div>
                ) : offers.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyIconCircle}>
                      <Tag size={24} />
                    </div>
                    <h3 className={styles.emptyTitle}>Aucune offre configurée</h3>
                    <p className={styles.emptyText}>
                      Créez vos vraies formules (formule midi, happy hour, menu dégustation) ou
                      importez votre carte pour promouvoir un plat en 1 clic.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOffer(null);
                        setIsOfferModalOpen(true);
                      }}
                      className={styles.addOfferBtn}
                    >
                      <Plus size={14} />
                      <span>Créer ma première offre</span>
                    </button>
                  </div>
                ) : (
                  <div className={styles.offersList}>
                    {offers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onClick={handleEdit}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>

        {isOfferModalOpen && (
          <OfferForm
            initialOffer={editingOffer}
            onSave={handleSaveOffer}
            onCancel={() => {
              setIsOfferModalOpen(false);
              setEditingOffer(null);
            }}
          />
        )}

        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
