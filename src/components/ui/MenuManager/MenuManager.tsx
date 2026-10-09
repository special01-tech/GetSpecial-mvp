'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Globe,
  Image as ImageIcon,
  UploadCloud,
  Sparkles,
  Check,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  RestaurantMenuData,
  INITIAL_RESTAURANT_MENU,
  RestaurantOffer,
} from '@/services/restaurant/restaurant-offers.data';
import styles from './MenuManager.module.css';

interface MenuManagerProps {
  restaurantName: string;
  onImportOffers: (newOffers: RestaurantOffer[]) => void;
  onNotice: (message: string) => void;
}

export default function MenuManager({
  restaurantName,
  onImportOffers,
  onNotice,
}: MenuManagerProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'url' | 'image'>('pdf');
  const [menuData, setMenuData] = useState<RestaurantMenuData | null>(INITIAL_RESTAURANT_MENU);
  const [webUrl, setWebUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any | null>(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le menu stocké au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('getspecial_restaurant_menu');
      if (stored) {
        setMenuData(JSON.parse(stored));
      }
    } catch {
      // Ignorer
    }
  }, []);

  const saveMenuData = (data: RestaurantMenuData | null) => {
    setMenuData(data);
    if (typeof window !== 'undefined') {
      if (data) {
        localStorage.setItem('getspecial_restaurant_menu', JSON.stringify(data));
      } else {
        localStorage.removeItem('getspecial_restaurant_menu');
      }
    }
  };

  // Gestion de l'upload de fichier (PDF ou Image)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type.includes('pdf') || file.name.endsWith('.pdf');
    const isImage = file.type.includes('image');

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.round(file.size / 1024)} Ko`;

    const newMenu: RestaurantMenuData = {
      sourceType: isPdf ? 'pdf' : isImage ? 'image' : 'pdf',
      name: file.name,
      fileSize: formattedSize,
      uploadedAt: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    saveMenuData(newMenu);
    onNotice(`Fichier « ${file.name} » ajouté avec succès. Prêt pour l’analyse IA.`);

    // Lancer automatiquement l'analyse après l'upload
    analyzeMenu(newMenu);
  };

  // Validation du site web
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webUrl.trim()) return;

    let cleanUrl = webUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newMenu: RestaurantMenuData = {
      sourceType: 'url',
      name: cleanUrl.replace(/^https?:\/\//, ''),
      url: cleanUrl,
      uploadedAt: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    saveMenuData(newMenu);
    onNotice(`Lien vers le menu enregistré : ${cleanUrl}`);
    analyzeMenu(newMenu);
  };

  // Appel de l'analyse IA via /api/menu/extract
  const analyzeMenu = async (currentMenu?: RestaurantMenuData | null) => {
    const targetMenu = currentMenu || menuData;
    if (!targetMenu) return;

    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/menu/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: targetMenu.sourceType,
          fileName: targetMenu.name,
          url: targetMenu.url,
          restaurantName,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const result = json.data;
        setExtractionResult(result);
        // Sélectionner toutes les offres extraites par défaut
        if (result.extractedOffers && result.extractedOffers.length > 0) {
          setSelectedOfferIds(result.extractedOffers.map((o: any) => o.id));
        }
        // Mettre à jour les métadonnées du menu enregistré
        const updatedMenu: RestaurantMenuData = {
          ...targetMenu,
          detectedCategories: result.detectedCategories,
          extractedCount: result.extractedOffers?.length || 0,
        };
        saveMenuData(updatedMenu);
        onNotice('Menu analysé ! L’IA a détecté vos formules et offres phares.');
      } else {
        throw new Error(json.error || 'Erreur lors de l’analyse');
      }
    } catch (err: any) {
      console.warn('Erreur extraction:', err);
      onNotice('Impossible d’analyser le menu pour le moment.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle sélection d'une offre extraite
  const toggleOfferSelection = (id: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Importer les offres sélectionnées dans les offres principales
  const handleImportSelected = () => {
    if (!extractionResult?.extractedOffers) return;

    const offersToImport: RestaurantOffer[] = extractionResult.extractedOffers
      .filter((o: any) => selectedOfferIds.includes(o.id))
      .map((o: any) => ({
        id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: o.name,
        description: o.description,
        discount: o.discount,
        period: o.period,
        image: o.image,
        status: 'active' as const,
        platforms: o.platforms || ['instagram', 'facebook', 'google_business'],
      }));

    if (offersToImport.length > 0) {
      onImportOffers(offersToImport);
      onNotice(`${offersToImport.length} offre(s) importée(s) dans vos offres principales !`);
      setExtractionResult(null);
    }
  };

  return (
    <div className={styles.menuCard}>
      {/* En-tête du module Menu */}
      <div className={styles.menuHeader}>
        <div className={styles.menuTitleGroup}>
          <div className={styles.menuIconCircle}>
            <FileText size={22} />
          </div>
          <div>
            <h3 className={styles.menuTitle}>Carte & Menu du restaurant</h3>
            <p className={styles.menuSubtitle}>
              Ajoutez votre carte pour que l’IA identifie et synchronise automatiquement vos formules phares.
            </p>
          </div>
        </div>

        <div className={styles.aiBadge}>
          <Sparkles size={13} />
          <span>Extraction IA de carte</span>
        </div>
      </div>

      {/* Onglets de sélection du type de menu */}
      <div className={styles.sourceTabsRow}>
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`${styles.sourceTabBtn} ${activeTab === 'pdf' ? styles.sourceTabActive : ''}`}
        >
          <FileText size={15} />
          <span>Document PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`${styles.sourceTabBtn} ${activeTab === 'url' ? styles.sourceTabActive : ''}`}
        >
          <Globe size={15} />
          <span>Site web / Carte en ligne</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`${styles.sourceTabBtn} ${activeTab === 'image' ? styles.sourceTabActive : ''}`}
        >
          <ImageIcon size={15} />
          <span>Photo / Ardoise (Image)</span>
        </button>
      </div>

      {/* Zone de téléversement / saisie selon l'onglet actif */}
      {activeTab === 'pdf' && (
        <div
          className={styles.uploadZone}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className={styles.fileInputHidden}
            onChange={handleFileUpload}
          />
          <UploadCloud size={30} className={styles.uploadIcon} />
          <p className={styles.uploadTitle}>
            Cliquez ou glissez-déposez le PDF de votre menu
          </p>
          <p className={styles.uploadDesc}>
            Format PDF jusqu’à 15 Mo (carte du midi, carte des vins, menu complet)
          </p>
        </div>
      )}

      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className={styles.urlInputRow}>
          <input
            type="text"
            placeholder="Ex: https://mon-restaurant.fr/carte ou lien Deliveroo / UberEats..."
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            className={styles.urlInput}
          />
          <button type="submit" className={styles.analyzeBtn}>
            <Globe size={14} />
            <span>Enregistrer & Analyser</span>
          </button>
        </form>
      )}

      {activeTab === 'image' && (
        <div
          className={styles.uploadZone}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={styles.fileInputHidden}
            onChange={handleFileUpload}
          />
          <ImageIcon size={30} className={styles.uploadIcon} />
          <p className={styles.uploadTitle}>
            Ajoutez une photo de votre carte, ardoise ou menu du jour
          </p>
          <p className={styles.uploadDesc}>
            PNG, JPG ou WEBP. L’IA lit et extrait le texte de vos ardoises.
          </p>
        </div>
      )}

      {/* Affichage du menu actif enregistré */}
      {menuData && (
        <div className={styles.activeMenuBox}>
          <div className={styles.activeMenuInfo}>
            <span className={styles.activeMenuBadge}>{menuData.sourceType}</span>
            <div>
              <span className={styles.activeMenuName}>{menuData.name}</span>
              <span className={styles.activeMenuMeta}>
                Ajouté le {menuData.uploadedAt}
                {menuData.fileSize ? ` • ${menuData.fileSize}` : ''}
                {menuData.extractedCount ? ` • ${menuData.extractedCount} offres détectées` : ''}
              </span>
            </div>
          </div>

          <div className={styles.activeMenuActions}>
            <button
              type="button"
              onClick={() => analyzeMenu(menuData)}
              disabled={isAnalyzing}
              className={styles.analyzeBtn}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Scanner & Extraire les offres</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                saveMenuData(null);
                onNotice('Menu retiré.');
              }}
              className={styles.removeMenuBtn}
              title="Supprimer ce menu"
              aria-label="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE DES RÉSULTATS D'EXTRACTION DE MENU PAR IA          */}
      {/* ========================================================= */}
      {extractionResult && (
        <div className={styles.extractionModalOverlay} role="dialog" aria-modal="true">
          <div className={styles.extractionModalCard}>
            <div className={styles.extractionModalHeader}>
              <div className={styles.extractionHeaderTitleRow}>
                <div className={styles.sparkleCircle}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className={styles.extractionModalTitle}>Formules & Offres détectées</h4>
                  <p className={styles.extractionModalSubtitle}>
                    {extractionResult.source?.name} • Sélectionnez les offres à importer dans vos offres principales.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExtractionResult(null)}
                className={styles.closeModalBtn}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.extractionModalBody}>
              {/* Catégories détectées */}
              {extractionResult.detectedCategories?.length > 0 && (
                <div className={styles.categoriesTagsRow}>
                  {extractionResult.detectedCategories.map((cat: string, i: number) => (
                    <span key={i} className={styles.categoryTag}>
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Liste des formules extraites */}
              <div className={styles.extractedOffersList}>
                {extractionResult.extractedOffers?.map((off: any) => {
                  const isChecked = selectedOfferIds.includes(off.id);
                  return (
                    <div
                      key={off.id}
                      className={`${styles.extractedOfferCard} ${
                        isChecked ? styles.extractedOfferSelected : ''
                      }`}
                      onClick={() => toggleOfferSelection(off.id)}
                    >
                      <div className={styles.checkboxCol}>
                        <div
                          className={`${styles.customCheckbox} ${
                            isChecked ? styles.customCheckboxChecked : ''
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>

                      <div className={styles.extractedOfferContent}>
                        <div className={styles.extractedOfferTop}>
                          <h5 className={styles.extractedOfferName}>{off.name}</h5>
                          <span className={styles.extractedOfferPrice}>{off.discount}</span>
                        </div>
                        <p className={styles.extractedOfferDesc}>{off.description}</p>
                        <div className={styles.extractedOfferPeriod}>
                          🕒 {off.period}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.extractionModalFooter}>
              <span className={styles.selectedCountNotice}>
                {selectedOfferIds.length} offre(s) sélectionnée(s)
              </span>

              <button
                type="button"
                onClick={handleImportSelected}
                disabled={selectedOfferIds.length === 0}
                className={styles.importSelectedBtn}
              >
                <Plus size={15} />
                <span>Importer dans mes offres principales ({selectedOfferIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
