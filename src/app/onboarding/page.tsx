'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const isCompleted = localStorage.getItem('getspecial_onboarding_completed') === 'true';
      if (isCompleted) {
        router.replace('/dashboard');
        return;
      }

      const savedStep = localStorage.getItem('getspecial_onboarding_step');
      if (savedStep && savedStep.startsWith('/onboarding/')) {
        router.replace(savedStep);
        return;
      }
    } catch {
      // Fallback
    }

    router.replace('/onboarding/search');
  }, [router]);

  return null;
}
