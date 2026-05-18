# BEDROCK.JS

A lightweight Node.js wrapper for running and auto-updating the official Minecraft Bedrock Dedicated Server (BDS) on Linux environments like Pterodactyl Panel.

## Features

- 🚀 Automatic Bedrock server downloading & updating
- 🔄 Checks latest version from remote API
- 🛡️ Protects important config files during updates
- ⚡ Auto-syncs ports with Pterodactyl environment variables
- 📦 Extracts and manages Bedrock server files automatically
- 🐧 Linux executable permission handling
- 🔌 Graceful shutdown support using SIGTERM
- 🌐 Network failure fallback support
- 📁 Clean and simple folder structure

---

## Protected Files

These files are preserved during updates:

- `server.properties`
- `permissions.json`
- `allowlist.json`
- `whitelist.json`

---

## Requirements

- Node.js 16+
- Linux VPS or dedicated server

Install dependencies:

```bash
npm install
