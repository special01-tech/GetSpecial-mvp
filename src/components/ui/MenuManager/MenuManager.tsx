'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  UploadCloud,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  RestaurantMenuData,
  RestaurantOffer,
} from '@/services/restaurant/restaurant-offers.data';
import styles from './MenuManager.module.css';

interface MenuManagerProps {
  restaurantName: string;
  initialMenu?: RestaurantMenuData | null;
  onImportOffers: (newOffers: RestaurantOffer[]) => void;
  onNotice: (message: string, variant?: 'success' | 'error') => void;
  onMenuExtracted?: (result: {
    dishes: any[];
    extractedOffers: any[];
    rawSummary?: string;
    detectedCategories?: string[];
    menuMetadata?: RestaurantMenuData;
  }) => void;
  onMenuCleared?: () => void;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo

export default function MenuManager({
  restaurantName,
  initialMenu = null,
  onNotice,
  onMenuExtracted,
  onMenuCleared,
}: MenuManagerProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'image'>('pdf');
  const [menuData, setMenuData] = useState<RestaurantMenuData | null>(initialMenu);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | null>(null);

  // Synchronise les métadonnées chargées depuis l'API parent
  useEffect(() => {
    if (initialMenu) {
      setMenuData(initialMenu);
    }
  }, [initialMenu]);

  const persistLocalMenu = (data: RestaurantMenuData | null) => {
    setMenuData(data);
    if (typeof window !== 'undefined') {
      if (data) {
        localStorage.setItem('getspecial_restaurant_menu', JSON.stringify(data));
      } else {
        localStorage.removeItem('getspecial_restaurant_menu');
      }
    }
  };

  // Gestion de l'upload de fichier (PDF ou Image uniquement)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Réinitialise l'input pour permettre de resélectionner le même fichier si besoin
    e.target.value = '';
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp' ||
      /\.(jpe?g|png|webp)$/i.test(file.name);

    // Erreurs imputables à l'utilisateur : message clair et direct
    if (!isPdf && !isImage) {
      onNotice(
        'Format non pris en charge. Veuillez importer un fichier PDF ou une image (JPG, PNG, WEBP).',
        'error'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onNotice('Ce fichier dépasse la taille maximale autorisée de 15 Mo.', 'error');
      return;
    }

    if (file.size === 0) {
      onNotice('Le fichier sélectionné est vide.', 'error');
      return;
    }

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.max(1, Math.round(file.size / 1024))} Ko`;

    const candidateMenu: RestaurantMenuData = {
      sourceType: isPdf ? 'pdf' : 'image',
      name: file.name,
      fileSize: formattedSize,
      uploadedAt: new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    const previousMenu = menuData;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedFileBase64(base64);
      setMenuData(candidateMenu);
      onNotice(`Lecture de « ${file.name} » en cours...`, 'success');
      analyzeMenu(candidateMenu, base64, previousMenu);
    };
    reader.onerror = () => {
      onNotice('Impossible de lire ce fichier. Vérifiez qu’il n’est pas endommagé.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Extraction IA via /api/menu/extract + sauvegarde réelle en base
  const analyzeMenu = async (
    targetMenu: RestaurantMenuData,
    fileBase64Override?: string,
    rollbackMenu?: RestaurantMenuData | null
  ) => {
    const fileBase64ToSend = fileBase64Override || uploadedFileBase64;
    if (!fileBase64ToSend) {
      onNotice('Veuillez sélectionner le fichier de votre carte pour lancer l’analyse.', 'error');
      fileInputRef.current?.click();
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/menu/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: targetMenu.sourceType,
          fileName: targetMenu.name,
          fileSize: targetMenu.fileSize,
          fileBase64: fileBase64ToSend,
          restaurantName,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        if (rollbackMenu !== undefined) {
          setMenuData(rollbackMenu);
        }
        // Si l'erreur provient du fichier/action utilisateur (4xx), afficher le conseil précis
        if (res.status >= 400 && res.status < 500 && json?.error) {
          onNotice(json.error, 'error');
        } else {
          // Erreur technique serveur/modèle : journalisée en console, message sobre côté utilisateur
          console.error('[MENU_MANAGER_EXTRACT_FAILURE]', res.status, json);
          onNotice(
            'L’analyse automatique de la carte est momentanément indisponible. Veuillez réessayer.',
            'error'
          );
        }
        return;
      }

      const result = json.data;
      const updatedMenu: RestaurantMenuData = {
        ...targetMenu,
        detectedCategories: result.detectedCategories || [],
        extractedCount: (result.dishes?.length || 0) + (result.extractedOffers?.length || 0),
      };

      // Sauvegarde réelle en base de données (plats complets + résumé + métadonnées du menu)
      const restaurantId =
        (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
        'current';

      const saveRes = await fetch(`/api/restaurants/${restaurantId}/dishes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishes: (result.dishes || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            category: d.category || 'Plats',
            price: d.price || '',
            priceText: d.price || '',
            description: d.description || '',
            isSignature: Boolean(d.isSignature),
          })),
          rawSummary: result.rawSummary || '',
          menuMetadata: updatedMenu,
        }),
      });

      const saveJson = await saveRes.json().catch(() => null);
      if (!saveRes.ok || !saveJson?.success) {
        console.error('[MENU_DISHES_DB_PATCH_ERROR]', saveRes.status, saveJson);
        onNotice(
          'Les plats ont été lus mais leur sauvegarde a échoué. Veuillez réessayer.',
          'error'
        );
        return;
      }

      persistLocalMenu(updatedMenu);

      onMenuExtracted?.({
        dishes: saveJson.data?.dishes || result.dishes || [],
        extractedOffers: result.extractedOffers || [],
        rawSummary: result.rawSummary || '',
        detectedCategories: result.detectedCategories || [],
        menuMetadata: updatedMenu,
      });

      onNotice(
        `${result.dishes?.length || 0} plat(s) et ${result.extractedOffers?.length || 0} formule(s) extraits et enregistrés.`,
        'success'
      );
    } catch (err) {
      console.error('[MENU_MANAGER_NETWORK_ERROR]', err);
      if (rollbackMenu !== undefined) {
        setMenuData(rollbackMenu);
      }
      onNotice('Connexion interrompue lors de l’analyse. Vérifiez votre réseau et réessayez.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Suppression réelle du menu actif en base et en local
  const handleRemoveMenu = async () => {
    const restaurantId =
      (typeof window !== 'undefined' ? localStorage.getItem('getspecial_restaurant_id') : null) ||
      'current';

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/dishes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishes: [],
          rawSummary: '',
          menuMetadata: null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error('[MENU_REMOVE_ERROR]', res.status, json);
        onNotice('Impossible de supprimer la carte pour le moment. Veuillez réessayer.', 'error');
        return;
      }

      persistLocalMenu(null);
      setUploadedFileBase64(null);
      onMenuCleared?.();
      onNotice('Carte retirée avec succès.', 'success');
    } catch (err) {
      console.error('[MENU_REMOVE_NETWORK_ERROR]', err);
      onNotice('Impossible de contacter le serveur pour supprimer la carte.', 'error');
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
              Importez un PDF ou une photo de votre carte pour extraire automatiquement vos plats et formules.
            </p>
          </div>
        </div>

        <div className={styles.aiBadge}>
          <Sparkles size={13} />
          <span>Extraction IA de carte</span>
        </div>
      </div>

      {/* Onglets de sélection : PDF ou Image uniquement */}
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
          onClick={() => setActiveTab('image')}
          className={`${styles.sourceTabBtn} ${activeTab === 'image' ? styles.sourceTabActive : ''}`}
        >
          <ImageIcon size={15} />
          <span>Photo / Ardoise (Image)</span>
        </button>
      </div>

      {/* Zone de téléversement selon l'onglet actif */}
      {activeTab === 'pdf' ? (
        <div
          className={styles.uploadZone}
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isAnalyzing) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className={styles.fileInputHidden}
            onChange={handleFileUpload}
            disabled={isAnalyzing}
          />
          <UploadCloud size={30} className={styles.uploadIcon} />
          <p className={styles.uploadTitle}>
            {isAnalyzing
              ? 'Analyse de votre PDF en cours...'
              : 'Cliquez pour importer le PDF de votre menu'}
          </p>
          <p className={styles.uploadDesc}>
            Format PDF jusqu’à 15 Mo (carte complète, formules du midi, boissons)
          </p>
        </div>
      ) : (
        <div
          className={styles.uploadZone}
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isAnalyzing) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={styles.fileInputHidden}
            onChange={handleFileUpload}
            disabled={isAnalyzing}
          />
          <ImageIcon size={30} className={styles.uploadIcon} />
          <p className={styles.uploadTitle}>
            {isAnalyzing
              ? 'Analyse de votre photo en cours...'
              : 'Importez une photo de votre carte ou ardoise du jour'}
          </p>
          <p className={styles.uploadDesc}>
            Formats JPG, PNG ou WEBP jusqu’à 15 Mo. Assurez-vous que les prix soient lisibles.
          </p>
        </div>
      )}

      {/* Affichage du menu actif réellement enregistré */}
      {menuData && (
        <div className={styles.activeMenuBox}>
          <div className={styles.activeMenuInfo}>
            <span className={styles.activeMenuBadge}>{menuData.sourceType}</span>
            <div>
              <span className={styles.activeMenuName}>{menuData.name}</span>
              <span className={styles.activeMenuMeta}>
                Ajouté le {menuData.uploadedAt}
                {menuData.fileSize ? ` • ${menuData.fileSize}` : ''}
                {menuData.extractedCount ? ` • ${menuData.extractedCount} éléments extraits` : ''}
              </span>
            </div>
          </div>

          <div className={styles.activeMenuActions}>
            <button
              type="button"
              onClick={() => {
                if (!uploadedFileBase64) {
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
                  <span>{uploadedFileBase64 ? 'Relancer l’analyse' : 'Remplacer le fichier'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRemoveMenu}
              disabled={isAnalyzing}
              className={styles.removeMenuBtn}
              title="Retirer cette carte et vider les plats extraits"
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
