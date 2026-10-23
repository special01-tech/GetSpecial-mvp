'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingConfirmRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/onboarding');
  }, [router]);

  return null;
}
