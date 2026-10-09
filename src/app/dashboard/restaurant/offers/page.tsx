'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Plus,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import OfferCard from '@/components/ui/OfferCard/OfferCard';
import OfferForm from '@/components/ui/OfferForm/OfferForm';
import MenuManager from '@/components/ui/MenuManager/MenuManager';
import { useLanguage } from '@/i18n';
import {
  RestaurantOffer,
  INITIAL_RESTAURANT_OFFERS,
} from '@/services/restaurant/restaurant-offers.data';
import styles from '../restaurant.module.css';

/**
 * Mon Resto — Offres Principales & Carte du Restaurant (/dashboard/restaurant/offers)
 *
 * Fonctionnalités clés :
 * 1. Définition et gestion autonome des offres principales par le restaurateur (CRUD).
 * 2. Ajout du menu (PDF, Site web, Photos / Images) avec extraction IA des formules & offres.
 * 3. Import direct des formules détectées dans les offres principales.
 */
export default function RestaurantOffersPage() {
  const { t } = useLanguage();
  const [restaurantName, setRestaurantName] = useState('Mon Restaurant');
  const [offers, setOffers] = useState<RestaurantOffer[]>(INITIAL_RESTAURANT_OFFERS);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<RestaurantOffer | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

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
      // Mode Édition
      const updated = offers.map((o) => (o.id === offerToSave.id ? offerToSave : o));
      await saveOffersList(updated, `Offre « ${offerToSave.name} » mise à jour avec succès.`);
    } else {
      // Mode Création
      const updated = [offerToSave, ...offers];
      await saveOffersList(updated, `Offre principale « ${offerToSave.name} » créée.`);

      // Synchronisation backend
      try {
        const restaurantId =
          localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
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
      `${newOffers.length} nouvelle(s) offre(s) importée(s) depuis votre menu !`
    );
  };

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
              Gérez vos offres phares et téléversez votre menu pour alimenter les campagnes IA.
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
            <span>Offres & Formules</span>
          </Link>

          <Link href="/dashboard/restaurant/events" className={styles.tabBtn}>
            <Calendar size={15} />
            <span>Événements locaux</span>
          </Link>
        </nav>

        {/* ========================================================= */}
        {/* CONTENU PRINCIPAL                                         */}
        {/* ========================================================= */}
        <main className={styles.mainContent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. MODULE CARTE & MENU DU RESTAURANT (PDF, Site Web, Images) */}
          <MenuManager
            restaurantName={restaurantName}
            onImportOffers={handleImportExtractedOffers}
            onNotice={showNotice}
          />

          {/* 2. SECTION OFFRES PRINCIPALES DU RESTAURANT (CRUD) */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.offersHeaderRow}>
              <div>
                <h2 className={styles.tabSectionTitle}>Offres principales du restaurant</h2>
                <p className={styles.tabSectionSubtitle}>
                  {offers.length === 0
                    ? 'Aucune offre configurée pour le moment.'
                    : `${activeCount} offre${activeCount > 1 ? 's' : ''} active${activeCount > 1 ? 's' : ''} sur ${offers.length} au total.`}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/dashboard/create?type=offer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    backgroundColor: '#FFF3EC',
                    border: '1px solid #FFE0CC',
                    color: '#E04F00',
                    textDecoration: 'none',
                  }}
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
              </div>
            </div>

            {/* Liste des offres principales ou État vide */}
            {offers.length === 0 ? (
              <div className={styles.emptyOffersBox}>
                <div className={styles.emptyOffersIcon}>
                  <UtensilsCrossed size={24} />
                </div>
                <h3 className={styles.emptyOffersTitle}>Aucune offre principale définie</h3>
                <p className={styles.emptyOffersText}>
                  Définissez vous-même vos offres phares (formule midi, happy hour, menu dégustation) ou téléversez le menu de votre restaurant ci-dessus pour laisser l’IA les extraire.
                </p>
                <div className={styles.emptyOffersActions}>
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
          </section>
        </main>

        {/* Modale de Création / Modification d'Offre */}
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
