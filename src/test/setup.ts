import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { installWebSpeechMocks } from './mocks/webSpeech';

beforeEach(() => {
  installWebSpeechMocks();
  window.localStorage.clear();
});

// Testing Library only auto-cleans between tests when Vitest globals are on;
// this project keeps globals off, so clean up explicitly.
afterEach(() => {
  cleanup();
});
