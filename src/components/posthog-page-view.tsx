// src/components/PostHogPageview.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';

export default function PostHogPageview() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture('$pageview');
    }
  }, [location, posthog]);

  return null;
}
