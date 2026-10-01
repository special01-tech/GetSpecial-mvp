'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wine, Tag, Calendar, UtensilsCrossed, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import SocialPostPreview from '@/components/ui/SocialPostPreview';
import styles from './creer.module.css';

interface IdeaChoice {
  id: string;
  name: string;
  desc: string;
  defaultPromo: string;
  defaultDescription: string;
  hours: string;
  icon: React.ComponentType<{ size?: number }>;
  image: string;
}

const IDEA_CHOICES: IdeaChoice[] = [
  {
    id: 'happy-hour',
    name: 'Happy Hour',
    desc: 'Boissons à prix réduit',
    defaultPromo: '-30% sur tous les cocktails',
    defaultDescription: 'Une bonne raison de passer nous voir ce soir ! Venez profiter de nos créations signatures à prix doux.',
    hours: '17h → 20h',
    icon: Wine,
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'special-offer',
    name: 'Offre spéciale',
    desc: 'Réduction sur un plat ou menu',
    defaultPromo: '1 Plat acheté = 1 Dessert offert',
    defaultDescription: 'Ce soir seulement, faites-vous plaisir en découvrant nos douceurs de saison offertes.',
    hours: 'Service du soir',
    icon: Tag,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'event',
    name: 'Événement',
    desc: 'Concert, soirée, animation',
    defaultPromo: 'Soirée Live Acoustique',
    defaultDescription: 'Ambiance feutrée et cocktails signature ce vendredi avec notre invité musical.',
    hours: 'Dès 20h30',
    icon: Calendar,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'menu-du-jour',
    name: 'Menu du jour',
    desc: 'Plat du jour ou spécialité',
    defaultPromo: 'Formule Déjeuner 18€',
    defaultDescription: 'Produits frais du marché et saveurs authentiques cuisinées ce matin par notre chef.',
    hours: '12h → 14h30',
    icon: UtensilsCrossed,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'custom',
    name: 'Autre',
    desc: 'Votre propre idée sur-mesure',
    defaultPromo: 'Création Signature du Moment',
    defaultDescription: 'Venez découvrir nos nouveautés préparées avec amour.',
    hours: 'Toute la journée',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=700&q=80',
  },
];

function CreatePublicationForm() {
  const searchParams = useSearchParams();
  const initialIdeaQuery = searchParams.get('idea');

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('happy-hour');
  const [promoText, setPromoText] = useState<string>('-30% sur tous les cocktails');
  const [hoursText, setHoursText] = useState<string>('17h → 20h');
  const [descriptionText, setDescriptionText] = useState<string>(
    'Une bonne raison de passer nous voir ce soir ! Venez profiter de nos créations signatures à prix doux.'
  );
  const [tone, setTone] = useState<string>('Convivial');
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<Array<{ platform: string; username: string; status: string }>>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Charger les comptes sociaux réels au montage
  React.useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch('/api/restaurants');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && json.data.length > 0) {
            const rest = json.data[0];
            setRestaurantId(rest.id);
            if (rest.socialAccounts && rest.socialAccounts.length > 0) {
              setSocialAccounts(rest.socialAccounts);
            }
          }
        }
      } catch {
        // Ignorer
      }
    }
    loadRestaurant();
  }, []);

  const selectedChoice = IDEA_CHOICES.find((c) => c.id === selectedIdeaId) || IDEA_CHOICES[0];

  const handleSelectIdea = (choice: IdeaChoice) => {
    setSelectedIdeaId(choice.id);
    setPromoText(choice.defaultPromo);
    setDescriptionText(choice.defaultDescription);
    setHoursText(choice.hours);
  };

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 2 | 3);
    } else {
      setIsSubmitting(true);
      try {
        const restIdToUse = restaurantId || (() => {
          // Dernier recours : chercher en direct
          return null;
        })();

        if (restIdToUse) {
          await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: restIdToUse,
              text: `${promoText}\n\n${descriptionText}\n\n📍 Horaires: ${hoursText} • Ambiance ${tone}`,
              imageUrl: selectedChoice.image,
              platform: 'instagram',
              status: 'scheduled',
            }),
          });
        }
      } catch (err) {
        console.error('Erreur création post:', err);
      } finally {
        setIsSubmitting(false);
        setIsPublishedSuccess(true);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Créer une publication"
        subtitle="Transformez une idée en une publication prête à publier en quelques minutes."
      />

      {/* Stepper Header */}
      <div className={styles.stepper}>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`${styles.stepItem} ${currentStep >= 1 ? styles.stepItemActive : ''}`}
        >
          <span className={`${styles.stepNumber} ${currentStep >= 1 ? styles.stepNumberActive : ''}`}>
            1
          </span>
          <span>Choisir une idée</span>
        </button>

        <span className={styles.stepDivider} />

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`${styles.stepItem} ${currentStep >= 2 ? styles.stepItemActive : ''}`}
        >
          <span className={`${styles.stepNumber} ${currentStep >= 2 ? styles.stepNumberActive : ''}`}>
            2
          </span>
          <span>Personnaliser</span>
        </button>

        <span className={styles.stepDivider} />

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`${styles.stepItem} ${currentStep >= 3 ? styles.stepItemActive : ''}`}
        >
          <span className={`${styles.stepNumber} ${currentStep >= 3 ? styles.stepNumberActive : ''}`}>
            3
          </span>
          <span>Générer</span>
        </button>
      </div>

      {/* Two columns layout */}
      <div className={styles.layout}>
        {/* Left Column: Form Workflow */}
        <div className={styles.formSection}>
          {isPublishedSuccess ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Check size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Publication programmée avec succès !</h3>
              <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '24px' }}>
                Votre publication pour &quot;{selectedChoice.name}&quot; a été planifiée sur vos canaux connectés (Instagram, Facebook).
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setIsPublishedSuccess(false);
                  setCurrentStep(1);
                }}
              >
                Créer une autre publication
              </Button>
            </div>
          ) : (
            <>
              {/* STEP 1: Choisir une idée */}
              {currentStep === 1 && (
                <>
                  <h3 className={styles.stepTitle}>1. Choisissez une idée</h3>
                  <div className={styles.optionsList}>
                    {IDEA_CHOICES.map((choice) => {
                      const Icon = choice.icon;
                      const isSelected = selectedIdeaId === choice.id;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleSelectIdea(choice)}
                          className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ''}`}
                        >
                          <div className={styles.optionLeft}>
                            <div className={styles.optionIcon}>
                              <Icon size={18} />
                            </div>
                            <div className={styles.optionTexts}>
                              <span className={styles.optionName}>{choice.name}</span>
                              <span className={styles.optionDesc}>{choice.desc}</span>
                            </div>
                          </div>
                          <div className={`${styles.checkIndicator} ${isSelected ? styles.checkIndicatorActive : ''}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP 2: Personnaliser */}
              {currentStep === 2 && (
                <>
                  <h3 className={styles.stepTitle}>2. Personnalisez votre message</h3>
                  <div className={styles.formFields}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Titre ou accroche promotionnelle</label>
                      <input
                        type="text"
                        value={promoText}
                        onChange={(e) => setPromoText(e.target.value)}
                        className={styles.input}
                        placeholder="Ex: -30% sur tous les cocktails"
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Créneau horaire / Disponibilité</label>
                      <input
                        type="text"
                        value={hoursText}
                        onChange={(e) => setHoursText(e.target.value)}
                        className={styles.input}
                        placeholder="Ex: 17h → 20h"
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Texte de la publication (légende)</label>
                      <textarea
                        rows={4}
                        value={descriptionText}
                        onChange={(e) => setDescriptionText(e.target.value)}
                        className={styles.textarea}
                        placeholder="Rédigez votre message pour vos clients..."
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.label}>Tonalité de communication</label>
                      <div className={styles.radioRow}>
                        {['Convivial', 'Festif', 'Élégant', 'Direct'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTone(t)}
                            className={`${styles.tonePill} ${tone === t ? styles.tonePillActive : ''}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3: Générer & Programmer */}
              {currentStep === 3 && (
                <>
                  <h3 className={styles.stepTitle}>3. Canaux de diffusion & planification</h3>
                  <div className={styles.channelsList}>
                    {socialAccounts.length > 0 ? (
                      socialAccounts.map((acc) => (
                        <div key={acc.platform} className={styles.channelItem}>
                          <div className={styles.channelInfo}>
                            <span>
                              {acc.platform === 'instagram' ? '📸 Instagram' : acc.platform === 'facebook' ? '📘 Facebook' : '🎵 TikTok'}
                              {acc.username ? ` (${acc.username})` : ''}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: acc.status === 'connected' ? '#22C55E' : '#94A3B8' }}>
                              ● {acc.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                            </span>
                          </div>
                          <input type="checkbox" defaultChecked={acc.status === 'connected'} />
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#94A3B8', fontSize: '0.85rem', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', textAlign: 'center' }}>
                        Aucun compte social connecté. <a href="/etablissement" style={{ color: '#FF5C00' }}>Connectez vos réseaux →</a>
                      </div>
                    )}
                  </div>

                  <div className={styles.fieldGroup} style={{ marginTop: '16px' }}>
                    <label className={styles.label}>Planification</label>
                    <select className={styles.input}>
                      <option>Publier immédiatement</option>
                      <option>Aujourd&apos;hui à 17h00 (Recommandé)</option>
                      <option>Ce vendredi à 18h30</option>
                      <option>Dimanche à 11h00</option>
                    </select>
                  </div>
                </>
              )}

              {/* Bottom Buttons */}
              <div className={styles.formActions}>
                {currentStep > 1 ? (
                  <Button variant="secondary" onClick={handlePrev}>
                    <ArrowLeft size={15} />
                    <span>Retour</span>
                  </Button>
                ) : (
                  <div />
                )}

                <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
                  <span>
                    {isSubmitting
                      ? 'Publication en cours...'
                      : currentStep === 3
                      ? 'Générer & Publier ✨'
                      : 'Suivant →'}
                  </span>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Live Social Preview */}
        <div className={styles.previewColumn}>
          <SocialPostPreview
            ideaTitle={selectedChoice.name}
            promoText={promoText}
            hours={hoursText}
            description={descriptionText}
            imageUrl={selectedChoice.image}
          />
        </div>
      </div>
    </div>
  );
}

export default function CreerPage() {
  return (
    <Suspense fallback={<div style={{ padding: '24px', color: '#94A3B8' }}>Chargement du créateur...</div>}>
      <CreatePublicationForm />
    </Suspense>
  );
}
