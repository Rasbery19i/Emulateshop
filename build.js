const fs = require('fs');
const zlib = require('zlib');

fs.mkdirSync('dist', { recursive: true });

const payload = fs
  .readFileSync('site.gz.b64', 'utf8')
  .replace(/\s/g, '');

const html = zlib.gunzipSync(Buffer.from(payload, 'base64'));

if (!html.toString('utf8').toLowerCase().includes('<html')) {
  throw new Error('Decoded payload is not a valid HTML document');
}

fs.writeFileSync('dist/index.html', html);
console.log(`Built dist/index.html: ${html.length} bytes`);
