'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Plus,
  CheckCircle2,
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
  INITIAL_RESTAURANT_OFFERS,
} from '@/services/restaurant/restaurant-offers.data';
import styles from './offers.module.css';

/**
 * Mon Resto — Plats ou Offres (/dashboard/restaurant/offers)
 *
 * Fonctionnalités clés :
 * 1. Gestion intégrée des Plats de la carte (extraits par IA, recherche, filtres par rubrique, vue liste/grille).
 * 2. Gestion des Offres principales (CRUD, activation/pause, promotion au Studio).
 * 3. Téléversement et synchronisation de la carte (PDF, photo, lien web) via MenuManager.
 * 4. Promotion de n'importe quel plat de la carte en offre principale en 1 clic.
 */
export default function RestaurantOffersPage() {
  const { t } = useLanguage();
  const [restaurantName, setRestaurantName] = useState('Mon Restaurant');
  const [offers, setOffers] = useState<RestaurantOffer[]>(INITIAL_RESTAURANT_OFFERS);
  const [dishes, setDishes] = useState<any[]>([]);
  const [menuSummary, setMenuSummary] = useState<string>('');

  // Navigation interne de la section : Plats ou Offres
  const [activeTabSection, setActiveTabSection] = useState<'dishes' | 'offers'>('dishes');

  // Recherche, filtres et mode d'affichage des plats
  const [dishSearch, setDishSearch] = useState('');
  const [dishCategoryFilter, setDishCategoryFilter] = useState('all');
  const [dishesViewMode, setDishesViewMode] = useState<'list' | 'grid'>('list');
  const [promotedDishIds, setPromotedDishIds] = useState<string[]>([]);

  // Modale CRUD d'offre
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<RestaurantOffer | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Chargement des données au montage (localStorage + API)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_selected_restaurant');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setRestaurantName(parsed.name);
      }

      const storedOffers = localStorage.getItem('getspecial_restaurant_offers');
      if (storedOffers) {
        const parsedOffers = JSON.parse(storedOffers);
        if (Array.isArray(parsedOffers)) {
          setOffers(parsedOffers);
        }
      }

      const storedDishes = localStorage.getItem('getspecial_restaurant_dishes');
      if (storedDishes) {
        const parsedDishes = JSON.parse(storedDishes);
        if (Array.isArray(parsedDishes) && parsedDishes.length > 0) {
          setDishes(parsedDishes);
          setActiveTabSection('dishes');
        }
      }

      const storedSummary = localStorage.getItem('getspecial_restaurant_menu_summary');
      if (storedSummary) {
        setMenuSummary(storedSummary);
      }

      // Synchronisation backend du profil pour récupérer les plats sauvegardés en DB
      const restaurantId =
        localStorage.getItem('getspecial_restaurant_id') || 'rest_paris_atelier_1';

      fetch(`/api/restaurants/${restaurantId}/profile`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const remoteDishes = json.data.profile?.customRules?.dishes;
            if (Array.isArray(remoteDishes) && remoteDishes.length > 0) {
              setDishes(remoteDishes);
              localStorage.setItem('getspecial_restaurant_dishes', JSON.stringify(remoteDishes));
            }
          }
        })
        .catch(() => {
          // Ignorer si hors-ligne
        });
    } catch {
      // Ignorer
    }
  }, []);

  const showNotice = (message: string) => {
    setSavedNotice(message);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const saveOffersList = async (updated: RestaurantOffer[], noticeMsg: string) => {
    setOffers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_offers', JSON.stringify(updated));
    }
    showNotice(noticeMsg);
  };

  // 1. Ajouter ou Modifier une offre principale (CRUD)
  const handleSaveOffer = async (offerToSave: RestaurantOffer) => {
    if (editingOffer) {
      const updated = offers.map((o) => (o.id === offerToSave.id ? offerToSave : o));
      await saveOffersList(updated, `Offre « ${offerToSave.name} » mise à jour avec succès.`);
    } else {
      const updated = [offerToSave, ...offers];
      await saveOffersList(updated, `Offre « ${offerToSave.name} » créée.`);

      try {
        const restaurantId =
          localStorage.getItem('getspecial_restaurant_id') || 'rest_paris_atelier_1';
        await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            title: offerToSave.name,
            description: offerToSave.description,
            discountValue: offerToSave.discount || 'Offre Spéciale',
            recurrence: 'daily',
            recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          }),
        });
      } catch (err) {
        console.warn('[OFFER_API_SYNC_ERROR]', err);
      }
    }

    setIsOfferModalOpen(false);
    setEditingOffer(null);
  };

  // 2. Ouvrir en mode édition
  const handleEdit = (offer: RestaurantOffer) => {
    setEditingOffer(offer);
    setIsOfferModalOpen(true);
  };

  // 3. Supprimer une offre
  const handleDelete = (id: string) => {
    const target = offers.find((o) => o.id === id);
    const updated = offers.filter((o) => o.id !== id);
    saveOffersList(updated, `Offre « ${target?.name || ''} » supprimée.`);
  };

  // 4. Toggle statut (Actif / En pause)
  const handleToggleStatus = (id: string) => {
    const updated = offers.map((o) => {
      if (o.id === id) {
        const nextStatus = o.status === 'active' ? 'draft' : 'active';
        return { ...o, status: nextStatus as RestaurantOffer['status'] };
      }
      return o;
    });
    const target = updated.find((o) => o.id === id);
    saveOffersList(
      updated,
      target?.status === 'active'
        ? `Offre « ${target.name} » activée.`
        : `Offre « ${target?.name || ''} » mise en pause.`
    );
  };

  // 5. Importer des offres extraites du menu
  const handleImportExtractedOffers = (newOffers: RestaurantOffer[]) => {
    const updated = [...newOffers, ...offers];
    saveOffersList(
      updated,
      `${newOffers.length} nouvelle(s) formule(s) importée(s) !`
    );
  };

  // 6. Callback après extraction complète par MenuManager
  const handleMenuExtracted = (result: any) => {
    if (result.dishes && Array.isArray(result.dishes)) {
      setDishes(result.dishes);
      setDishSearch('');
      setDishCategoryFilter('all');
      if (typeof window !== 'undefined') {
        localStorage.setItem('getspecial_restaurant_dishes', JSON.stringify(result.dishes));
      }
    }

    if (result.rawSummary) {
      setMenuSummary(result.rawSummary);
      if (typeof window !== 'undefined') {
        localStorage.setItem('getspecial_restaurant_menu_summary', result.rawSummary);
      }
    }

    // Si des formules combos ont été extraites, les ajouter automatiquement
    if (result.extractedOffers && result.extractedOffers.length > 0) {
      const formatted = result.extractedOffers.map((o: any) => ({
        id: `off_menu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: o.name,
        description: o.description,
        discount: o.discount,
        period: o.period || 'Toute la semaine',
        status: 'active' as const,
        platforms: ['instagram', 'facebook', 'google_business'] as ('instagram' | 'facebook' | 'google_business')[],
      }));
      handleImportExtractedOffers(formatted);
    }

    // Basculer automatiquement sur la vue des plats extraits
    setActiveTabSection('dishes');
  };

  // 7. Promouvoir un plat individuel en offre principale
  const handlePromoteDishToOffer = (dish: any) => {
    if (promotedDishIds.includes(dish.id)) return;

    const newOffer: RestaurantOffer = {
      id: `off_dish_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Spécialité : ${dish.name}`,
      description: dish.description || `Découvrez notre plat phare : ${dish.name}`,
      discount: dish.price || 'À la carte',
      period: 'Toute la semaine',
      status: 'active',
      platforms: ['instagram', 'facebook', 'google_business'],
    };

    handleSaveOffer(newOffer);
    setPromotedDishIds((prev) => [...prev, dish.id]);
    showNotice(`Plat « ${dish.name} » ajouté à vos offres principales !`);
  };

  // Rubriques uniques détectées parmi les plats
  const availableCategories: string[] = useMemo(() => {
    return Array.from(
      new Set(
        dishes
          .map((d: any) => (d.category || '').trim())
          .filter(Boolean)
      )
    );
  }, [dishes]);

  // Plats filtrés par recherche et par catégorie
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
        {/* ========================================================= */}
        {/* EN-TÊTE DE LA PAGE                                        */}
        {/* ========================================================= */}
        <header className={styles.header}>
          <div className={styles.headerTexts}>
            <h1 className={styles.pageMainTitle}>Mon Resto</h1>
            <p className={styles.pageMainSubtitle}>
              Gérez votre carte, vos plats et vos offres phares pour alimenter les campagnes IA.
            </p>
          </div>
        </header>

        {/* Notice temporaire de confirmation */}
        {savedNotice && (
          <div className={styles.savedNotice}>
            <CheckCircle2 size={16} />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLETS INTERNES DE NAVIGATION                           */}
        {/* ========================================================= */}
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

        {/* ========================================================= */}
        {/* CONTENU PRINCIPAL                                         */}
        {/* ========================================================= */}
        <main className={styles.mainContent}>
          {/* 1. MODULE CARTE & MENU DU RESTAURANT (PDF, Site Web, Images) */}
          <MenuManager
            restaurantName={restaurantName}
            onImportOffers={handleImportExtractedOffers}
            onNotice={showNotice}
            onMenuExtracted={handleMenuExtracted}
          />

          {/* 2. SECTION PLATS OU OFFRES DU RESTAURANT */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2 className={styles.tabSectionTitle}>Plats ou Offres</h2>
                <p className={styles.tabSectionSubtitle}>
                  {dishes.length} plat{dishes.length > 1 ? 's' : ''} à la carte • {activeCount} offre{activeCount > 1 ? 's' : ''} active{activeCount > 1 ? 's' : ''} sur {offers.length} au total.
                </p>
              </div>

              <div className={styles.headerActions}>
                {activeTabSection === 'offers' ? (
                  <>
                    <Link
                      href="/dashboard/create?type=offer"
                      className={styles.studioLinkBtn}
                    >
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
                      <span>+ Nouvelle offre</span>
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

            {/* Résumé culinaire détecté par l'IA */}
            {menuSummary && (
              <div className={styles.summaryBanner}>
                💡 <strong>Positionnement culinaire :</strong> {menuSummary}
              </div>
            )}

            {/* Onglets de bascule : Plats de la carte vs Offres */}
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

            {/* ========================================================= */}
            {/* VUE 1 : PLATS DE LA CARTE                                 */}
            {/* ========================================================= */}
            {activeTabSection === 'dishes' && (
              <>
                {dishes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Toolbar : Recherche et Catégories */}
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

                      {/* Filtres par rubriques (Pills) */}
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

                    {/* Rendu des plats filtrés : Liste ou Grille */}
                    {filteredDishes.length === 0 ? (
                      <div className={styles.emptyBox}>
                        <p className={styles.emptyText}>
                          Aucun plat ne correspond à « {dishSearch} ».
                        </p>
                      </div>
                    ) : dishesViewMode === 'list' ? (
                      <div className={styles.dishesList}>
                        {filteredDishes.map((dish: any) => {
                          const isPromoted = promotedDishIds.includes(dish.id);
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
                                {dish.price && (
                                  <span className={styles.dishPrice}>{dish.price}</span>
                                )}
                                {isPromoted ? (
                                  <span className={styles.dishPromotedBadge}>
                                    <Check size={13} strokeWidth={2.5} />
                                    <span>Offre ajoutée</span>
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
                          const isPromoted = promotedDishIds.includes(dish.id);
                          return (
                            <div key={dish.id || dish.name} className={styles.dishCard}>
                              <div>
                                <div className={styles.dishCardHeader}>
                                  <h4 className={styles.dishName}>{dish.name}</h4>
                                  {dish.price && (
                                    <span className={styles.dishPrice}>{dish.price}</span>
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
                                    <span>Offre ajoutée</span>
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
                      Téléversez la carte ou le menu de votre restaurant ci-dessus (PDF, photo ou lien). L’IA se charge d'extraire automatiquement tous vos plats, rubriques et tarifs.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ========================================================= */}
            {/* VUE 2 : OFFRES & FORMULES DU RESTAURANT                   */}
            {/* ========================================================= */}
            {activeTabSection === 'offers' && (
              <>
                {offers.length === 0 ? (
                  <div className={styles.emptyBox}>
                    <div className={styles.emptyIconCircle}>
                      <Tag size={24} />
                    </div>
                    <h3 className={styles.emptyTitle}>Aucune offre principale configurée</h3>
                    <p className={styles.emptyText}>
                      Définissez vos formules phares (formule midi, happy hour, menu dégustation) ou promouvez un plat de votre carte ci-contre.
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

        {/* Modale de Création / Modification manuelle d'Offre */}
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

        {/* Spacer pour Bottom Navigation mobile */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
