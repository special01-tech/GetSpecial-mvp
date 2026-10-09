import { redirect } from 'next/navigation';

export default function MockOAuthDialog() {
  redirect('/dashboard/settings');
}
