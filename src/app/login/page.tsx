'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo/Logo';
import AuthLayout from '@/components/layout/AuthLayout/AuthLayout';
import SocialLoginButton from '@/components/ui/SocialLoginButton/SocialLoginButton';
import EmailAuthButton from '@/components/ui/EmailAuthButton/EmailAuthButton';
import PrimaryButton from '@/components/ui/PrimaryButton/PrimaryButton';
import { authClientService } from '@/services/auth/auth.client.service';
import styles from './login.module.css';

/**
 * Écran 2 : Inscription / Connexion GetSpecial
 *
 * Conforme à la maquette :
 * - Logo GetSpecial
 * - Titre "Bienvenue !"
 * - Sous-titre "Créez votre compte pour commencer."
 * - Bouton "Continuer avec Google"
 * - Bouton "Continuer avec email"
 * - Lien "J'ai déjà un compte" / "Créer un compte"
 * - Texte légal en bas
 * - Formulaire email fonctionnel avec retours visuels (états loading, success, error)
 */
export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'options' | 'email_form' | 'existing_account'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  React.useEffect(() => {
    // Vérifier si l'utilisateur arrive avec un paramètre pour forcer une nouvelle inscription
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'register' || urlParams.get('new') === 'true') {
        setMode('email_form');
        authClientService.logout();
      }
    }
  }, []);

  // Authentification Google
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await authClientService.loginWithGoogle();
      if (res.success) {
        setFeedback({ type: 'success', message: 'Connexion Google réussie ! Redirection...' });
        setTimeout(() => {
          router.push('/dashboard');
        }, 600);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erreur lors de la connexion Google.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Impossible de contacter le service Google.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Authentification Email (Inscription ou Connexion)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFeedback({ type: 'error', message: 'Veuillez saisir votre email.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const isLogin = mode === 'existing_account';
      const res = isLogin
        ? await authClientService.loginWithEmail(email, password)
        : await authClientService.registerWithEmail(email, password, name);

      if (res.success) {
        setFeedback({
          type: 'success',
          message: isLogin ? 'Connexion réussie !' : 'Compte créé avec succès !',
        });
        setTimeout(() => {
          router.push(isLogin ? '/dashboard' : '/onboarding');
        }, 700);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Une erreur est survenue.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erreur réseau. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header avec Logo */}
      <div className={styles.header}>
        <div className={styles.logoRow}>
          {mode !== 'options' && (
            <button
              onClick={() => { setMode('options'); setFeedback(null); }}
              className={styles.backButton}
              aria-label="Retour aux options"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <Logo size="md" showTagline={false} />
        </div>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>
            {mode === 'existing_account' ? 'Bon retour !' : 'Bienvenue !'}
          </h1>
          <p className={styles.subtitle}>
            {mode === 'existing_account'
              ? 'Connectez-vous à votre espace restaurant.'
              : 'Créez votre compte pour commencer.'}
          </p>
        </div>
      </div>

      {/* Message de feedback visuel */}
      {feedback && (
        <div
          className={`${styles.feedbackBanner} ${
            feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className={styles.feedbackIcon} />
          ) : (
            <AlertCircle size={16} className={styles.feedbackIcon} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Vue 1 : Boutons de sélection principaux */}
      {mode === 'options' && (
        <div className={styles.actionsContainer}>
          <SocialLoginButton
            provider="google"
            isLoading={isLoading}
            onClick={handleGoogleAuth}
          />

          <EmailAuthButton onClick={() => setMode('email_form')}>
            Continuer avec email
          </EmailAuthButton>

          <div className={styles.switchRow}>
            <span className={styles.switchPrompt}>Vous utilisez déjà GetSpecial ?</span>
            <button
              onClick={() => { setMode('existing_account'); setFeedback(null); }}
              className={styles.linkButton}
            >
              J&apos;ai déjà un compte
            </button>
          </div>
        </div>
      )}

      {/* Vue 2 & 3 : Formulaire Email (Création ou Connexion) */}
      {mode !== 'options' && (
        <form onSubmit={handleEmailSubmit} className={styles.formContainer}>
          {mode === 'email_form' && (
            <div className={styles.inputGroup}>
              <label htmlFor="nameInput" className={styles.label}>
                Nom du restaurant ou de l&apos;établissement
              </label>
              <input
                id="nameInput"
                type="text"
                placeholder="Ex. Le Bistrot Parisien"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="emailInput" className={styles.label}>
              Adresse email professionnelle
            </label>
            <input
              id="emailInput"
              type="email"
              placeholder="contact@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="passwordInput" className={styles.label}>
              Mot de passe
            </label>
            <input
              id="passwordInput"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <PrimaryButton
            type="submit"
            disabled={isLoading}
            className={styles.submitBtn}
          >
            {isLoading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Chargement...</span>
              </span>
            ) : mode === 'existing_account' ? (
              'Se connecter'
            ) : (
              'Créer mon compte'
            )}
          </PrimaryButton>

          <div className={styles.switchRow}>
            {mode === 'existing_account' ? (
              <>
                <span className={styles.switchPrompt}>Pas encore de compte ?</span>
                <button
                  type="button"
                  onClick={() => { setMode('email_form'); setFeedback(null); }}
                  className={styles.linkButton}
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                <span className={styles.switchPrompt}>Vous utilisez déjà GetSpecial ?</span>
                <button
                  type="button"
                  onClick={() => { setMode('existing_account'); setFeedback(null); }}
                  className={styles.linkButton}
                >
                  J&apos;ai déjà un compte
                </button>
              </>
            )}
          </div>
        </form>
      )}

      {/* Mentions Légales en bas */}
      <footer className={styles.footerLegal}>
        <p>
          En continuant, vous acceptez les{' '}
          <Link href="#" className={styles.legalLink}>
            Conditions Générales
          </Link>{' '}
          et la{' '}
          <Link href="#" className={styles.legalLink}>
            Politique de Confidentialité
          </Link>{' '}
          de GetSpecial.
        </p>
      </footer>
    </AuthLayout>
  );
}
