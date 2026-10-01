'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  Tag,
  Calendar,
  Share2,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import OfferCard from '@/components/ui/OfferCard/OfferCard';
import OfferForm from '@/components/ui/OfferForm/OfferForm';
import {
  RestaurantOffer,
  INITIAL_RESTAURANT_OFFERS,
} from '@/services/restaurant/restaurant-offers.data';
import styles from '../restaurant.module.css';

/**
 * Écran 15 Dédié : Mon restaurant - Offres (/dashboard/restaurant/offers)
 *
 * Mêmes en-tête et navigation interne :
 * - Profil (/dashboard/restaurant)
 * - Offres (/dashboard/restaurant/offers)
 * - Événements (/dashboard/restaurant/events)
 * - Comptes (/dashboard/restaurant/accounts)
 *
 * Liste des offres existantes :
 * - Image
 * - Nom
 * - Description
 * - Période
 * - Statut (Active, Programmée, Brouillon)
 * - Plateformes (Instagram, Facebook, Google Business)
 *
 * Bouton :
 * "+ Ajouter une offre"
 *
 * Modale OfferForm :
 * - titre, description, image, réduction, date, heure, plateformes
 */
export default function RestaurantOffersPage() {
  const [restaurantName, setRestaurantName] = useState('Le Petit Bistrot');
  const [offers, setOffers] = useState<RestaurantOffer[]>(INITIAL_RESTAURANT_OFFERS);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
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
        setOffers(JSON.parse(storedOffers));
      }
    } catch {
      // Ignorer
    }
  }, []);

  const handleAddOffer = async (newOffer: RestaurantOffer) => {
    const updated = [newOffer, ...offers];
    setOffers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('getspecial_restaurant_offers', JSON.stringify(updated));
      const restaurantId = localStorage.getItem('getspecial_restaurant_id') || 'rest_demo_austin_1';
      try {
        await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            title: newOffer.name,
            description: newOffer.description,
            discountValue: newOffer.discountValue || 'Offre Spéciale',
            recurrence: 'daily',
            recurrenceDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          }),
        });
      } catch (err) {
        console.warn('[OFFER_API_SYNC_ERROR]', err);
      }
    }
    setIsOfferModalOpen(false);
    setSavedNotice(`🎉 Offre "${newOffer.name}" créée et enregistrée avec succès.`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.container}>
        {/* Header Restaurant */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.storeAvatar}>
              <Store size={22} className={styles.storeIcon} />
            </div>
            <div>
              <h1 className={styles.headerTitle}>{restaurantName}</h1>
              <p className={styles.headerSubtitle}>Gestion de l&apos;établissement & IA</p>
            </div>
          </div>
        </header>

        {/* Notice temporaire de confirmation */}
        {savedNotice && (
          <div className={styles.savedNotice}>
            <CheckCircle2 size={16} />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Navigation Interne (Tabs) */}
        <nav className={styles.tabsNav} aria-label="Sections du restaurant">
          <Link href="/dashboard/restaurant" className={styles.tabBtn}>
            <Store size={14} />
            <span>Profil</span>
          </Link>

          <Link href="/dashboard/restaurant/offers" className={`${styles.tabBtn} ${styles.tabActive}`}>
            <Tag size={14} />
            <span>Offres</span>
          </Link>

          <Link href="/dashboard/restaurant/events" className={styles.tabBtn}>
            <Calendar size={14} />
            <span>Événements</span>
          </Link>

          <Link href="/dashboard/restaurant/accounts" className={styles.tabBtn}>
            <Share2 size={14} />
            <span>Comptes</span>
          </Link>
        </nav>

        {/* CONTENU ONGLET OFFRES */}
        <main className={styles.mainContent}>
          {/* Header d'actions des offres */}
          <div className={styles.offersHeaderRow}>
            <div>
              <h2 className={styles.tabSectionTitle}>Offres spéciales & promos</h2>
              <p className={styles.tabSectionSubtitle}>
                {offers.length} offre{offers.length > 1 ? 's' : ''} configurée{offers.length > 1 ? 's' : ''} pour votre restaurant
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
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  color: '#EA580C',
                  textDecoration: 'none',
                }}
              >
                <Sparkles size={14} />
                <span>🎨 Studio Affiche & Légende</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsOfferModalOpen(true)}
                className={styles.addOfferBtn}
              >
                <Plus size={15} />
                <span>+ Ajouter une offre</span>
              </button>
            </div>
          </div>

          {/* Liste des offres existantes */}
          <div className={styles.offersList}>
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onClick={(selected) => {
                  setSavedNotice(`Offre "${selected.name}" sélectionnée.`);
                  setTimeout(() => setSavedNotice(null), 3000);
                }}
              />
            ))}
          </div>
        </main>

        {/* Modal Création d'Offre (OfferForm) */}
        {isOfferModalOpen && (
          <OfferForm
            onSave={handleAddOffer}
            onCancel={() => setIsOfferModalOpen(false)}
          />
        )}

        {/* Spacer pour Bottom Navigation */}
        <div className={styles.bottomSpacer} />
      </div>
    </div>
  );
}
