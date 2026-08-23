import { permanentRedirect } from 'next/navigation';

// 308 rather than a temporary redirect so search engines consolidate ranking
// signals for `/` onto `/home` instead of indexing both.
export default function HomePage() {
  permanentRedirect('/home');
}
