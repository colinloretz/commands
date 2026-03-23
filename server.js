const http = require('http');
const fs = require('fs');
const path = require('path');
const { verifyRequest } = require('./verify');

// Load .env
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const PORT = process.env.PORT || 3000;
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

// Full product catalog
const ALL_PRODUCTS = [
  { name: 'Product A', value: 'product_a' },
  { name: 'Product B', value: 'product_b' },
  { name: 'Product C', value: 'product_c' },
  { name: 'Product D', value: 'product_d' },
  { name: 'Product E', value: 'product_e' },
  { name: 'Product F', value: 'product_f' },
  { name: 'Product G', value: 'product_g' },
  { name: 'Product H', value: 'product_h' },
  { name: 'Product I', value: 'product_i' },
  { name: 'Product J', value: 'product_j' },
  { name: 'Product K', value: 'product_k' },
  { name: 'Product L', value: 'product_l' },
];

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Returns a random subset of 4-5 products each time, filtered by query
async function getSupportProducts(query) {
  const count = 4 + Math.floor(Math.random() * 2); // 4 or 5
  const subset = pickRandom(ALL_PRODUCTS, count);
  if (!query) return subset;
  return subset.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
}

function jsonResponse(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleRequest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  // Collect raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  // Verify signature
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  if (!signature || !timestamp || !verifyRequest(rawBody, signature, timestamp, PUBLIC_KEY)) {
    res.writeHead(401);
    res.end('Invalid request signature');
    return;
  }

  const body = JSON.parse(rawBody);

  // Type 1: PING
  if (body.type === 1) {
    jsonResponse(res, 200, { type: 1 });
    return;
  }

  // Type 4: AUTOCOMPLETE
  if (body.type === 4) {
    const commandName = body.data.name;
    if (commandName === 'support') {
      const focused = body.data.options.find(o => o.focused);
      const query = focused ? focused.value : '';
      const products = await getSupportProducts(query);
      jsonResponse(res, 200, {
        type: 8,
        data: { choices: products.slice(0, 25) },
      });
      return;
    }
    jsonResponse(res, 400, { error: 'Unknown autocomplete command' });
    return;
  }

  // Type 2: APPLICATION_COMMAND
  if (body.type === 2) {
    const commandName = body.data.name;
    const selected = body.data.options?.[0]?.value || 'unknown';

    if (commandName === 'support' || commandName === 'support-test') {
      jsonResponse(res, 200, {
        type: 4,
        data: {
          content: `You selected: **${selected}**. A support agent will help you with this shortly.`,
          flags: 64,
        },
      });
      return;
    }

    jsonResponse(res, 400, { error: 'Unknown command' });
    return;
  }

  res.writeHead(400);
  res.end('Unknown interaction type');
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Discord bot server listening on port ${PORT}`);
});
