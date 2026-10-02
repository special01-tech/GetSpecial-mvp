'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Globe, X, Check } from 'lucide-react';
import {
  WORLD_COUNTRIES,
  CountryItem,
  findCountry,
} from '@/services/country/countries.data';
import styles from './CountrySelect.module.css';

interface CountrySelectProps {
  value: string; // Code ISO (ex: 'CI', 'FR') ou nom de pays
  onChange: (countryCode: string, countryName: string) => void;
  id?: string;
  placeholder?: string;
}

export default function CountrySelect({
  value,
  onChange,
  id = 'country',
  placeholder = 'Sélectionnez ou recherchez votre pays...',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Pays actuellement sélectionné selon la prop value
  const activeCountry = useMemo(() => findCountry(value), [value]);
  const displayName = activeCountry ? activeCountry.nameFr : value || '';

  // Synchronisation du champ de texte :
  // Quand le menu est fermé, on affiche le pays sélectionné
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(displayName);
    }
  }, [isOpen, displayName]);

  // Filtrage des pays :
  // Si le menu est ouvert et que le texte correspond exactement au pays actif,
  // ou si la recherche est vide, on affiche la liste complète !
  const filteredCountries = useMemo(() => {
    const clean = searchTerm.trim().toLowerCase();
    if (!clean || clean === displayName.toLowerCase()) {
      return WORLD_COUNTRIES;
    }
    return WORLD_COUNTRIES.filter(
      (c) =>
        c.nameFr.toLowerCase().includes(clean) ||
        c.nameEn.toLowerCase().includes(clean) ||
        c.code.toLowerCase().includes(clean)
    );
  }, [searchTerm, displayName]);

  // Réinitialiser la surbrillance quand la liste filtrée change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredCountries.length]);

  // Fermer le dropdown en cas de clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isOpen) {
          handleClose();
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, searchTerm, displayName, activeCountry]);

  // Ouverture du dropdown
  const handleOpen = () => {
    setIsOpen(true);
    // Sélectionner tout le texte pour faciliter la recherche immédiate
    setTimeout(() => {
      inputRef.current?.select();
    }, 10);
  };

  // Fermeture et validation si nécessaire
  const handleClose = () => {
    setIsOpen(false);
    const clean = searchTerm.trim();
    if (clean && clean !== displayName) {
      const match = findCountry(clean);
      if (match) {
        onChange(match.code, match.nameFr);
        setSearchTerm(match.nameFr);
      } else {
        // Pays personnalisé (ex: Micronésie ou nouveau pays)
        onChange(clean.slice(0, 3).toUpperCase(), clean);
        setSearchTerm(clean);
      }
    } else {
      setSearchTerm(displayName);
    }
  };

  // Sélection d'un pays
  const handleSelect = (country: CountryItem) => {
    onChange(country.code, country.nameFr);
    setSearchTerm(country.nameFr);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Saisie au clavier
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Effacer la sélection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  // Navigation clavier
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCountries.length > 0 && filteredCountries[highlightedIndex]) {
          handleSelect(filteredCountries[highlightedIndex]);
        } else if (searchTerm.trim()) {
          // Utiliser le pays personnalisé
          const clean = searchTerm.trim();
          onChange(clean.slice(0, 3).toUpperCase(), clean);
          setSearchTerm(clean);
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm(displayName);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className={styles.container} ref={wrapperRef}>
      <div
        className={`${styles.inputGroup} ${isOpen ? styles.inputGroupActive : ''}`}
        onClick={() => {
          if (!isOpen) handleOpen();
        }}
      >
        <span className={styles.flagIcon} title="Pays">
          <Globe size={18} strokeWidth={1.75} />
        </span>

        <input
          ref={inputRef}
          id={id}
          type="text"
          className={styles.input}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />

        <div className={styles.actions}>
          {searchTerm && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              title="Effacer la recherche"
              tabIndex={-1}
            >
              <X size={15} strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            className={`${styles.chevronBtn} ${isOpen ? styles.chevronRotated : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isOpen) {
                handleClose();
              } else {
                handleOpen();
              }
            }}
            tabIndex={-1}
            title={isOpen ? 'Fermer la liste' : 'Ouvrir la liste des pays'}
          >
            <ChevronDown size={17} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {isOpen && (
        <ul
          ref={listRef}
          className={styles.dropdown}
          onMouseDown={(e) => e.preventDefault()} // Empêche la perte de focus de l'input au clic
        >
          {filteredCountries.length > 0 ? (
            filteredCountries.map((item, index) => {
              const isSelected = item.code === activeCountry?.code;
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={item.code}
                  className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${
                    isHighlighted ? styles.optionHighlighted : ''
                  }`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className={styles.optionCodeBadge}>{item.code}</span>
                  <span className={styles.optionName}>
                    {item.nameFr}
                    {item.phonePrefix && (
                      <span className={styles.optionPrefix}> ({item.phonePrefix})</span>
                    )}
                  </span>
                  {isSelected && (
                    <span className={styles.checkIcon}>
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li
              className={styles.customOption}
              onClick={() => {
                const clean = searchTerm.trim();
                onChange(clean.slice(0, 3).toUpperCase(), clean);
                setSearchTerm(clean);
                setIsOpen(false);
              }}
            >
              <span className={styles.customOptionIcon}>
                <Globe size={18} strokeWidth={1.75} />
              </span>
              <div className={styles.customOptionContent}>
                <span className={styles.customOptionTitle}>
                  Pays non répertorié : &quot;<strong>{searchTerm}</strong>&quot;
                </span>
                <span className={styles.customOptionSubtitle}>
                  Cliquez ou appuyez sur Entrée pour valider ce pays
                </span>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

