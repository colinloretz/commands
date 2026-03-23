 To get it running:

  1. Fill in .env with your Discord app credentials from the Developer Portal
  2. Optionally add `DISCORD_GUILD_ID` for instant command registration (global commands take up to 1hr)
  3. Run the steps:

```
  npm start              # Start the server on port 3000
  npm run tunnel         # In another terminal — cloudflared gives you a public URL
  npm run register       # In another terminal — register the slash commands
```

  4. Copy the cloudflared URL into Discord Developer Portal > General Information > Interactions Endpoint URL and save (Discord will PING to
  validate)

  - `/support` — shows a dynamic autocomplete dropdown (Product A/B/C) filtered as you type
  - `/support-test` — shows a static dropdown (Product X/Y) built into Discord's UI

  5. Update the json values in server.js to see the dropdown options change in real-time without needing to re-register commands or update the Discord app settings.

  6. Run `npm run register` again to see the new dropdown options for `/support-test` which are hardcoded in the command definition and require re-registration to update.