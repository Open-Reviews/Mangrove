const { getIssuer, getSubject, generateKeypair, keypairToJwk, jwkToKeypair } = require('./index');

const TEST_API = 'http://localhost:8000'

test('subject has count', () => {
  return getSubject(
    'geo:47.1691576,8.514572?q=Juanitos&u=30',
    TEST_API
  ).then(({ count }) => expect(count).toBe(6));
});

test('issuer has count', () => {
  return getIssuer(
    '-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEnxypIPrmIqDWG/iHN133+MwKmCfA3rUGiDYIear/atAIL8GaCOORJOctvmbfQPxwENYp3O9piz9ChLVe8upguQ==-----END PUBLIC KEY-----',
    TEST_API
  ).then(({ count }) => expect(count).toBe(10));
});

test('keypair-jwk isomorphism', async () => {
  const keypair = await generateKeypair()
  const jwk = await keypairToJwk(keypair)
  const keypairNew = await jwkToKeypair(jwk)
  const jwkNew = await keypairToJwk(keypairNew)
  expect(JSON.stringify(jwk)).toBe(JSON.stringify(jwkNew));
});