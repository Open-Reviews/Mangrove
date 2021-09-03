import '@testing-library/jest-dom/extend-expect';
import indexedDB from 'fake-indexeddb';
import auto from 'fake-indexeddb/auto';

import { server } from '../src/mocks/server';
// Establish API mocking before all tests.
beforeAll(() => {
  server.listen();
});
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());

const fetch = require('node-fetch');
global.fetch = fetch;

const WebCrypto = require('node-webcrypto-ossl');
global.crypto = new WebCrypto();
crypto = global.crypto;
Object.defineProperty(window, 'crypto', {
  value: crypto,
});

// local storage mock
var localStorageMock = (function () {
  var store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

jest.setTimeout(20000);
