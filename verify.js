const nacl = require('tweetnacl');

function verifyRequest(rawBody, signature, timestamp, publicKey) {
  const msg = Buffer.from(timestamp + rawBody);
  const sig = Buffer.from(signature, 'hex');
  const key = Buffer.from(publicKey, 'hex');
  return nacl.sign.detached.verify(msg, sig, key);
}

module.exports = { verifyRequest };
