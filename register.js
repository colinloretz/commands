const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
for (const line of envContent.split('\n')) {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const commands = [
  {
    name: 'support',
    description: 'Get support for a product',
    type: 1,
    options: [
      {
        name: 'product',
        description: 'Which product do you need help with?',
        type: 3,
        required: true,
        autocomplete: true,
      },
    ],
  },
  {
    name: 'support-test',
    description: 'Get support for a product (static choices)',
    type: 1,
    options: [
      {
        name: 'product',
        description: 'Which product do you need help with?',
        type: 3,
        required: true,
        choices: [
          { name: 'Product X', value: 'product_x' },
          { name: 'Product Y', value: 'product_y' },
        ],
      },
    ],
  },
];

function discordApi(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'discord.com',
      path: `/api/v10${apiPath}`,
      method,
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        } else {
          resolve(JSON.parse(responseData));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const endpoint = GUILD_ID
    ? `/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `/applications/${APP_ID}/commands`;

  const scope = GUILD_ID ? `guild ${GUILD_ID}` : 'global';
  console.log(`Registering commands (${scope})...`);

  const result = await discordApi('PUT', endpoint, commands);
  console.log(`Registered ${result.length} commands:`);
  for (const cmd of result) {
    console.log(`  - /${cmd.name} (id: ${cmd.id})`);
  }
}

main().catch(err => {
  console.error('Failed to register commands:', err.message);
  process.exit(1);
});
