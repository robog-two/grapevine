'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/cabinets', label: 'Cabinets', icon: '\u{1F5C4}' },
  { href: '/people', label: 'All People', icon: '▦' },
];

function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function TopNav({ email }: { email?: string }) {
  const pathname = usePathname();
  return (
    <nav className="app-nav">
      <Link href="/" className="app-nav-brand" aria-label="Home">
        {'\u{1F347}'}
      </Link>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="nav-link" data-current={isCurrent(pathname, l.href)}>
          {l.label}
        </Link>
      ))}
      <Link href="/search" className="nav-link nav-search" aria-label="Search" data-current={isCurrent(pathname, '/search')}>
        {'\u{1F50D}'}
      </Link>
      {email ? (
        <Link href="/account" className="nav-link nav-user" data-current={isCurrent(pathname, '/account')}>
          {email}
        </Link>
      ) : null}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const mobileLinks = [
    { href: '/cabinets', label: 'Cabinets', icon: '\u{1F5C4}' },
    { href: '/people', label: 'All People', icon: '▦' },
    { href: '/search', label: 'Search', icon: '\u{1F50D}' },
  ];
  return (
    <div className="app-bottomnav">
      {mobileLinks.map((l) => (
        <Link key={l.href} href={l.href} data-current={isCurrent(pathname, l.href)}>
          <span>{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </div>
  );
}
