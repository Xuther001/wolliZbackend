const forge = require('node-forge');
const fs = require('fs');

// Generate a key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a self-signed cert
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

// Set certificate subject and issuer
const attrs = [
  { name: 'commonName', value: 'wolliZ-app' },
  { name: 'organizationName', value: 'Your Company' },
  { name: 'countryName', value: 'US' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs);

// Self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM
const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
const certPem = forge.pki.certificateToPem(cert);

// Write files
fs.writeFileSync('private.key', privateKeyPem);
fs.writeFileSync('certificate.crt', certPem);

console.log('✅ Generated private.key and certificate.crt');