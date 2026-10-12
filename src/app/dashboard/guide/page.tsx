'use client';

import React from 'react';
import { GLOSSARY } from '@/content/glossary.fr';
import { HelpTerm } from '@/components/ui/HelpTerm/HelpTerm';
import { HowItsCalculated } from '@/components/ui/HowItsCalculated/HowItsCalculated';
import styles from './guide.module.css';

export default function GuidePage() {
  const glossaryEntries = Object.entries(GLOSSARY);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Guide Pédagogique & Glossaire GetSpecial</h1>
        <p className={styles.subtitle}>
          Comprendre le fonctionnement du moteur économique, la mesure sans lien avec la caisse et la routine quotidienne d'un restaurant.
        </p>
      </header>

      {/* SECTION 1 : Une Journée Type */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📅 Une Journée Type avec GetSpecial</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineStep}>
            <div className={styles.stepBadge}>09h00</div>
            <div className={styles.stepContent}>
              <h3>Le Résumé du Matin (Gérant)</h3>
              <p>
                Le gérant consulte le bilan de la veille. Le système compare les couverts réalisés aux couverts habituels (baseline B) et formule une recommandation transparente : <strong>Garder</strong>, <strong>Ajuster</strong> ou <strong>Laisser</strong>.
              </p>
            </div>
          </div>

          <div className={styles.timelineStep}>
            <div className={styles.stepBadge}>10h30</div>
            <div className={styles.stepContent}>
              <h3>Détection des Créneaux Creux & Proposition</h3>
              <p>
                L'Opportunity Engine analyse la météo locale, les jours creux déclarés et le calendrier pour proposer une offre ciblée avec un mot-code distinct et un calcul de rentabilité (point mort N* et risque maximal).
              </p>
            </div>
          </div>

          <div className={styles.timelineStep}>
            <div className={styles.stepBadge}>Service</div>
            <div className={styles.stepContent}>
              <h3>Comptage en Salle (Staff & QR Code)</h3>
              <p>
                Deux modes simples : le client scanne le QR code sur table pour afficher le mot-code avec compte à rebours, ou le serveur appuie sur "+1 Comptabiliser" lors de l'annonce du mot-code au comptoir. Annulation possible sous 2 minutes en cas d'erreur.
              </p>
            </div>
          </div>

          <div className={styles.timelineStep}>
            <div className={styles.stepBadge}>Fin de service</div>
            <div className={styles.stepContent}>
              <h3>Clôture Rapide (30 secondes)</h3>
              <p>
                Le gérant ou le chef de rang saisit le nombre total de couverts du service. La médiane des 8 derniers services comparables alimente automatiquement la baseline sans jamais fausser les calculs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 : Explications des Formules */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📐 Comment Sont Calculées Vos Métriques ?</h2>
        <div className={styles.calculators}>
          <HowItsCalculated
            title="Point Mort (N*)"
            formula="N* = (B × C) / (m - C)"
            explanation="C'est le nombre minimum de nouveaux clients nécessaires pour que l'offre ne coûte rien au restaurant. B représente les couverts habituels, C le coût de l'avantage accordé, et m la marge brute par plat."
            example="Pour un plat à 25€ avec 30% de coût matière (m=17,50€), une remise de 20% (C=5€) et 12 habituels (B=12), il faut exactement N* = 4,8 (soit 5 clients) pour être rentable."
          />

          <HowItsCalculated
            title="Gain Estimé Net"
            formula="Gain = (Couverts réels - B) × m - (Personnes offre × C)"
            explanation="Mesure le surplus financier réel généré par l'offre en déduisant le coût total des avantages distribués du surplus de marge apporté par les nouveaux couverts."
            example="Si 20 personnes viennent (effet = +8 par rapport aux 12 habituels), le gain est de 8 × 17,50€ - 20 × 5€ = +40€."
          />

          <HowItsCalculated
            title="Risque Maximal"
            formula="Risque = -B × C"
            explanation="Le coût dans le pire des cas si tous vos clients habituels profitent de l'avantage sans qu'aucun nouveau client ne franchisse la porte."
            example="Avec 12 habituels et un avantage de 5€, la perte maximale possible est bornée à -60€."
          />
        </div>
      </section>

      {/* SECTION 3 : Glossaire Terme à Terme */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📖 Glossaire Complet des Termes</h2>
        <div className={styles.glossaryGrid}>
          {glossaryEntries.map(([key, item]) => (
            <div key={key} className={styles.glossaryCard}>
              <div className={styles.glossaryHeader}>
                <h3 className={styles.glossaryTerm}>{item.term}</h3>
                {item.formula && <span className={styles.tag}>Formule</span>}
              </div>
              <p className={styles.glossaryDef}>{item.definition}</p>
              {item.formula && (
                <div className={styles.formulaLine}>
                  <code>{item.formula}</code>
                </div>
              )}
              {item.example && (
                <p className={styles.glossaryEx}>
                  <strong>Exemple :</strong> {item.example}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
