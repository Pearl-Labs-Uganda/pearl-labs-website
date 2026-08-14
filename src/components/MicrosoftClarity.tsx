'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { applyOptOutFromUrl, shouldTrack } from '@/lib/analytics';

export default function MicrosoftClarity() {
  const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
  // Start disabled on both server and first client render so hydration matches;
  // the real opt-out check only runs after mount, once cookies are readable.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    applyOptOutFromUrl();
    setEnabled(shouldTrack());
  }, []);

  if (!CLARITY_ID || !enabled) return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
      `}
    </Script>
  );
}
