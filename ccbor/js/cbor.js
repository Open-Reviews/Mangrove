// Use like this `node cbor.js lib action payload`
// Where `lib`: `cbor`/`borc`, `action`: `encode`/`decode`, `payload`: json/bytes

const cbor = require('cbor')
const borc = require('borc')

const lib = process.argv[2] === 'borc' ? borc : cbor
const action = process.argv[3]
const payload = JSON.parse(process.argv[4])

if (action === 'encode') {
  console.log([...lib.encode(payload)])
} else if (action === 'decode') {
  console.log(lib.decode(new Uint8Array(payload)))
} else {
  console.log('Unknown action: ', action)
}
