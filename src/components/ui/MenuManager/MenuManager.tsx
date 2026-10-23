'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Globe,
  Image as ImageIcon,
  UploadCloud,
  Sparkles,
  Trash2,
  Loader2,
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
  onMenuExtracted?: (result: {
    dishes: any[];
    extractedOffers: any[];
    rawSummary?: string;
    detectedCategories?: string[];
  }) => void;
}

export default function MenuManager({
  restaurantName,
  onImportOffers,
  onNotice,
  onMenuExtracted,
}: MenuManagerProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'url' | 'image'>('pdf');
  const [menuData, setMenuData] = useState<RestaurantMenuData | null>(INITIAL_RESTAURANT_MENU);
  const [webUrl, setWebUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Base64 du dernier fichier uploadé (PDF ou image) — envoyé directement à l'API
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);

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

  // Gestion de l'upload de fichier (PDF ou Image) — lecture base64 pour l'envoi IA
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

    // Lecture du fichier en base64 pour envoi à l'API d'extraction IA
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedFileBase64(base64);
      saveMenuData(newMenu);
      onNotice(`Fichier « ${file.name} » chargé. Analyse IA en cours...`);
      analyzeMenu(newMenu, base64);
    };
    reader.onerror = () => {
      onNotice('Erreur lors de la lecture du fichier. Réessayez.');
    };
    reader.readAsDataURL(file);
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
  const analyzeMenu = async (currentMenu?: RestaurantMenuData | null, fileBase64Override?: string) => {
    const targetMenu = currentMenu || menuData;
    if (!targetMenu) return;

    setIsAnalyzing(true);

    // Base64 à utiliser : priorité au paramètre direct (upload frais), sinon état
    const fileBase64ToSend = fileBase64Override || uploadedFileBase64 || null;

    try {
      const res = await fetch('/api/menu/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: targetMenu.sourceType,
          fileName: targetMenu.name,
          fileSize: targetMenu.fileSize,
          url: targetMenu.url || undefined,
          fileBase64: fileBase64ToSend || undefined,
          restaurantName,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const result = json.data;

        // Mettre à jour les métadonnées du menu enregistré
        const updatedMenu: RestaurantMenuData = {
          ...targetMenu,
          detectedCategories: result.detectedCategories,
          extractedCount: result.extractedOffers?.length || 0,
        };
        saveMenuData(updatedMenu);

        // Persister les dishes extraits en base de données
        if (result.dishes && result.dishes.length > 0) {
          try {
            const restaurantId =
              (typeof window !== 'undefined'
                ? localStorage.getItem('getspecial_restaurant_id')
                : null) || 'current';

            await fetch(`/api/restaurants/${restaurantId}/dishes`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dishes: result.dishes.map((d: any) => ({
                  name: d.name,
                  description: d.description || '',
                  priceText: d.price || '',
                })),
              }),
            });
          } catch (dbErr) {
            console.warn('[MENU_DISHES_DB_PATCH_ERROR]', dbErr);
          }
        }

        // Sauvegarder dans le localStorage pour persistance immédiate
        if (typeof window !== 'undefined') {
          if (result.dishes) {
            localStorage.setItem('getspecial_restaurant_dishes', JSON.stringify(result.dishes));
          }
          if (result.rawSummary) {
            localStorage.setItem('getspecial_restaurant_menu_summary', result.rawSummary);
          }
        }

        // Émettre au composant parent (RestaurantOffersPage) pour mettre à jour la section Plats ou Offres
        onMenuExtracted?.(result);

        onNotice(`✅ ${result.dishes?.length || 0} plat(s) et ${result.extractedOffers?.length || 0} offre(s) extraits de votre menu !`);
      } else {
        throw new Error(json.error || 'Erreur lors de l\'analyse');
      }
    } catch (err: any) {
      console.warn('Erreur extraction:', err);
      onNotice('Impossible d\'analyser le menu pour le moment.');
    } finally {
      setIsAnalyzing(false);
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
              onClick={() => {
                if (menuData.sourceType !== 'url' && !uploadedFileBase64) {
                  onNotice('Veuillez resélectionner le fichier de votre carte pour relancer l’analyse.');
                  fileInputRef.current?.click();
                  return;
                }
                analyzeMenu(menuData);
              }}
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
    </div>
  );
}
