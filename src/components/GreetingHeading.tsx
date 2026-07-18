'use client';

import { useEffect, useState } from 'react';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/** Client-side so the greeting reflects the visitor's local time, not the server's. */
export function GreetingHeading() {
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return <h1 style={{ fontSize: 24, marginBottom: 'var(--space-3)' }}>Good {greeting ?? ' '}</h1>;
}
