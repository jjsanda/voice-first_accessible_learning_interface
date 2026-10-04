import type { Citation } from '../types/answer';
import { useAppStore } from '../state/appStore';
import { routeToHash } from '../state/useHashRoute';

export function CitationList({ citations }: { citations: Citation[] }) {
  const { course } = useAppStore();
  if (citations.length === 0) return null;

  return (
    <div className="citations">
      <span className="citations__label">Sources:</span>
      <ul className="citations__list">
        {citations.map((citation) => {
          const lesson = course.lessons.find((l) => l.id === citation.lessonId);
          const sectionIndex = lesson?.sections.findIndex((s) => s.id === citation.sectionId) ?? -1;
          const href = routeToHash({
            mode: 'lessons',
            lessonId: citation.lessonId,
            sectionIndex: sectionIndex >= 0 ? sectionIndex : 0,
          });
          return (
            <li key={citation.sectionId}>
              <a href={href}>
                {citation.lessonTitle} → {citation.sectionTitle}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
