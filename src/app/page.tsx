import { redirect } from 'next/navigation';

/**
 * Page racine — Redirige vers le dashboard.
 *
 * Plus tard, cette page pourra afficher une landing ou
 * rediriger vers /login si l'utilisateur n'est pas connecté.
 */
export default function HomePage() {
  redirect('/dashboard');
}
