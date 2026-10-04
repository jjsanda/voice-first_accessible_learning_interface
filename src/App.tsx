import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CommandHelp } from './components/CommandHelp';
import { LiveRegion } from './components/LiveRegion';
import { SkipLink } from './components/SkipLink';
import { VoiceHud, type HudStatus } from './components/VoiceHud';
import { parseCommand } from './commands/parser';
import { useCommandRouter } from './commands/useCommandRouter';
import { CourseValidationError } from './course/validate';
import { loadCourse } from './course/loader';
import { useSpeechRecognition } from './speech/useSpeechRecognition';
import { useSpeechSynthesis } from './speech/useSpeechSynthesis';
import { AppStoreProvider, useAppStore } from './state/appStore';
import { applyTheme, loadSettings, type Settings } from './state/settings';
import { routeToHash, useHashRoute } from './state/useHashRoute';
import { AskView } from './views/AskView';
import { HomeView } from './views/HomeView';
import { LessonsView } from './views/LessonsView';
import { QuizView } from './views/QuizView';
import { SettingsView } from './views/SettingsView';

export function App() {
  const [course, courseError] = useMemo(() => {
    try {
      return [loadCourse(), null] as const;
    } catch (error) {
      return [null, error] as const;
    }
  }, []);

  if (!course) {
    return (
      <main className="container">
        <h1>Course failed to load</h1>
        <pre>
          {courseError instanceof CourseValidationError ? courseError.message : String(courseError)}
        </pre>
      </main>
    );
  }

  return (
    <AppStoreProvider course={course}>
      <AppShell />
    </AppStoreProvider>
  );
}

const NAV_ITEMS = [
  ['home', 'Home'],
  ['ask', 'Ask'],
  ['lessons', 'Lessons'],
  ['quiz', 'Quiz'],
  ['settings', 'Settings'],
] as const;

function AppShell() {
  const store = useAppStore();
  const { route, navigate } = useHashRoute();
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  const tts = useSpeechSynthesis(settings.voiceRate);
  const { setRate } = tts;

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    setRate(settings.voiceRate);
  }, [settings.voiceRate, setRate]);

  const router = useCommandRouter({
    route,
    navigate,
    speak: tts.speak,
    stopSpeaking: tts.stop,
    pauseSpeaking: tts.pause,
    resumeSpeaking: tts.resume,
    openHelp: () => setHelpOpen(true),
  });

  const { dispatch } = store;
  const recognition = useSpeechRecognition({
    onFinal: (transcript) => {
      const command = parseCommand(transcript, { mode: route.mode });
      setLastCommand(command.matchedPhrase ?? transcript);
      router.execute(command.intent);
    },
    onError: (error) => {
      dispatch({ type: 'ANNOUNCE', text: error.message, assertive: true });
    },
  });

  const toggleMic = useCallback(() => {
    if (recognition.listening) {
      recognition.stop();
    } else {
      // Never listen while speaking — the mic would pick up our own voice.
      tts.stop();
      recognition.start();
    }
  }, [recognition, tts]);

  // Announce microphone state changes — Space users have focus elsewhere, so
  // the mic button's own state is invisible to screen readers at that moment.
  const wasListening = useRef(false);
  useEffect(() => {
    if (recognition.listening !== wasListening.current) {
      wasListening.current = recognition.listening;
      dispatch({
        type: 'ANNOUNCE',
        text: recognition.listening ? 'Listening.' : 'Microphone off.',
      });
    }
  }, [recognition.listening, dispatch]);

  // Global shortcuts: Space = push-to-talk (optional), Esc = stop speech, ? = help.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (event.key === 'Escape') {
        tts.stop();
        return;
      }
      if (inField) return;
      // Space must not hijack activation of buttons or links.
      const onControl = target?.closest('a, button, [role="button"]') !== null;
      if (settings.spacePushToTalk && event.code === 'Space' && !event.repeat && !onControl) {
        event.preventDefault();
        toggleMic();
      }
      if (event.key === '?') {
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleMic, tts, settings.spacePushToTalk]);

  // Per-view document titles, and focus onto the view heading when the view
  // (or the open lesson) changes.
  useEffect(() => {
    const viewNames: Record<string, string> = {
      home: 'Home',
      ask: 'Ask',
      lessons: 'Lessons',
      quiz: 'Quiz',
      settings: 'Settings',
    };
    document.title = `${viewNames[route.mode] ?? 'Home'} — Voice-First Learning`;
    const heading = document.querySelector<HTMLElement>('[data-view-heading]');
    heading?.focus();
  }, [route.mode, route.lessonId]);

  // Keep the reader's section in sync with the route. An index-less lesson
  // link means "start at the first section", not "wherever the last lesson was".
  useEffect(() => {
    if (route.mode === 'lessons' && route.lessonId !== undefined) {
      dispatch({ type: 'SET_SECTION', index: route.sectionIndex ?? 0 });
    }
  }, [route.mode, route.lessonId, route.sectionIndex, dispatch]);

  const hudStatus: HudStatus = recognition.listening
    ? 'listening'
    : store.state.askStatus === 'thinking'
      ? 'thinking'
      : tts.speaking
        ? 'speaking'
        : recognition.supported
          ? 'idle'
          : 'unsupported';

  return (
    <div className="app">
      <SkipLink />
      <header className="app-header">
        <div className="container app-header__inner">
          <a className="app-header__brand" href="#/">
            <span aria-hidden="true">🎙</span> Voice-First Learning
          </a>
          <nav aria-label="Main">
            <ul className="app-header__nav">
              {NAV_ITEMS.map(([mode, label]) => (
                <li key={mode}>
                  <a
                    href={routeToHash({ mode })}
                    aria-current={route.mode === mode ? 'page' : undefined}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="container app-main">
        {route.mode === 'home' && <HomeView onIntent={router.execute} />}
        {route.mode === 'ask' && (
          <AskView onAsk={(q) => void router.ask(q)} onSpeak={(t) => tts.speak(t)} />
        )}
        {route.mode === 'lessons' && (
          <LessonsView
            route={route}
            speaking={tts.speaking}
            onReadLesson={(id, section) => router.readLesson(id, section)}
            onNavigateSection={(id, index) =>
              navigate({ mode: 'lessons', lessonId: id, sectionIndex: index })
            }
            onStopSpeaking={tts.stop}
          />
        )}
        {route.mode === 'quiz' && <QuizView onIntent={router.execute} />}
        {route.mode === 'settings' && (
          <SettingsView settings={settings} onSettingsChange={setSettings} />
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>
            Works fully without voice, too — every action has a button or key.{' '}
            <button type="button" className="app-footer__link" onClick={() => setHelpOpen(true)}>
              See all commands
            </button>
          </p>
        </div>
      </footer>

      <VoiceHud
        status={hudStatus}
        sttSupported={recognition.supported}
        interimTranscript={recognition.interimTranscript}
        lastCommand={lastCommand}
        onMicToggle={toggleMic}
        onStopSpeaking={tts.stop}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <CommandHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LiveRegion />
    </div>
  );
}
