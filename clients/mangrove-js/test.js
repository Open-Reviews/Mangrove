const { generateKeypair, keypairToJwk, jwkToKeypair } = require('./index');

test('keypair-jwk isomorphism', async () => {
  const keypair = await generateKeypair()
  const jwk = await keypairToJwk(keypair)
  const keypairNew = await jwkToKeypair(jwk)
  expect(keypairNew).toStrictEqual(keypair)
  const jwkNew = await keypairToJwk(keypairNew)
  expect(jwkNew).toStrictEqual(jwk);
});