'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { applyOptOutFromUrl, shouldTrack } from '@/lib/analytics';

export default function GoogleAnalytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  // Start disabled on both server and first client render so hydration matches;
  // the real opt-out check only runs after mount, once cookies are readable.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    applyOptOutFromUrl();
    setEnabled(shouldTrack());
  }, []);

  if (!GA_ID || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}