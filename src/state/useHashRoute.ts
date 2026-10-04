import { useCallback, useEffect, useState } from 'react';
import type { AppMode } from '../types/commands';

export interface Route {
  mode: AppMode;
  /** Lesson open in the reader (lessons mode only). */
  lessonId?: string;
  /** Section index within the open lesson. */
  sectionIndex?: number;
}

/**
 * Tiny hash router. Hash routing (#/quiz instead of /quiz) is deliberate:
 * the app is a static site on GitHub Pages, where real sub-paths would 404
 * on refresh. No dependency needed for five routes.
 */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'ask':
      return { mode: 'ask' };
    case 'lessons': {
      if (parts[1] === undefined) return { mode: 'lessons' };
      let lessonId = parts[1];
      try {
        lessonId = decodeURIComponent(parts[1]);
      } catch {
        // Malformed percent-encoding in a hand-typed URL — use it verbatim.
      }
      const sectionIndex = parts[2] !== undefined ? Number.parseInt(parts[2], 10) : undefined;
      return {
        mode: 'lessons',
        lessonId,
        sectionIndex:
          sectionIndex !== undefined && Number.isFinite(sectionIndex) && sectionIndex >= 0
            ? sectionIndex
            : undefined,
      };
    }
    case 'quiz':
      return { mode: 'quiz' };
    case 'settings':
      return { mode: 'settings' };
    default:
      return { mode: 'home' };
  }
}

export function routeToHash(route: Route): string {
  switch (route.mode) {
    case 'home':
      return '#/';
    case 'lessons':
      if (route.lessonId === undefined) return '#/lessons';
      return route.sectionIndex !== undefined
        ? `#/lessons/${encodeURIComponent(route.lessonId)}/${route.sectionIndex}`
        : `#/lessons/${encodeURIComponent(route.lessonId)}`;
    default:
      return `#/${route.mode}`;
  }
}

export function useHashRoute(): { route: Route; navigate: (route: Route) => void } {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.location.hash = routeToHash(next);
  }, []);

  return { route, navigate };
}
