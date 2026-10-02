'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingSearchRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return null;
}
