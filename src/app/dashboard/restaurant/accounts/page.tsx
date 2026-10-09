'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RestaurantAccountsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
      <p>Redirection vers les Réglages pour la gestion des réseaux sociaux...</p>
    </div>
  );
}
