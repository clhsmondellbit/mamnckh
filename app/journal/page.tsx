import { redirect } from 'next/navigation';

/** The old browser-only journal remains in localStorage for explicit migration. */
export default function JournalPage() {
  redirect('/studio');
}
