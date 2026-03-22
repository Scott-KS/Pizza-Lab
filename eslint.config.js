import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        indexedDB: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        Notification: 'readonly',
        Event: 'readonly',
        HTMLElement: 'readonly',
        MutationObserver: 'readonly',
        MouseEvent: 'readonly',
        matchMedia: 'readonly',
        history: 'readonly',
        location: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        console: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        Blob: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',

        // Capacitor globals (loaded externally by native shell)
        Capacitor: 'readonly',
        Purchases: 'readonly',

        // Vendor globals (loaded via non-module script tags)
        html2canvas: 'readonly',

        // Capacitor window globals (set conditionally in capacitor-init.js)
        PieLabHaptics: 'readonly',
        PieLabNativeShare: 'readonly',

        // Browser globals not in eslint's default browser set
        prompt: 'readonly',
        File: 'readonly',
        crypto: 'readonly',
        TextEncoder: 'readonly',
        Uint8Array: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-globals': 'error',
    },
  },
  // CommonJS files (Node scripts, Capacitor config)
  {
    files: ['capacitor.config.js', 'scripts/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    ignores: ['js/vendor/**', 'node_modules/**', 'android/**', 'ios/**', 'www/**'],
  },
];
