import { useAppStore } from '../state/appStore';

/**
 * Screen-reader announcer. Status updates go to a polite live region;
 * errors are rendered with role="alert" (implicitly assertive). Visually
 * hidden — sighted users get the same information from the VoiceHud.
 */
export function LiveRegion() {
  const { state } = useAppStore();
  const announcement = state.announcement;

  // The nonce keys the text node so repeating the same message still swaps
  // the DOM node — otherwise screen readers stay silent the second time.
  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="visually-hidden">
        {announcement && !announcement.assertive ? (
          <span key={announcement.nonce}>{announcement.text}</span>
        ) : null}
      </div>
      <div role="alert" aria-atomic="true" className="visually-hidden">
        {announcement?.assertive ? <span key={announcement.nonce}>{announcement.text}</span> : null}
      </div>
    </>
  );
}
