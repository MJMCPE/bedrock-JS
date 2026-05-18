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

---

## Install Dependencies

### Linux VPS

Install Node.js:

```bash
apt update && apt upgrade -y
apt install -y curl unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Check versions:

```bash
node -v
npm -v
```

Install project dependencies:

```bash
npm install
```

---

### Pterodactyl Panel

Startup command:

```bash
node index.js
```

Install dependencies:

```bash
npm install
```

Or manually:

```bash
npm install axios adm-zip
```

---

## Usage

Start the updater and Bedrock server:

```bash
node index.js
```

The script will:

1. Check for the latest Bedrock server version
2. Download updates if needed
3. Extract server files
4. Sync ports with Pterodactyl
5. Launch the Bedrock server

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| SERVER_PORT | Main Bedrock server port |

Example:

```bash
SERVER_PORT=19132 node index.js
```

---

## Folder Structure

```text
Bedrock-JS/
├── index.js
├── package.json
├── server_update.zip
└── bedrock_server/
    ├── bedrock_server
    ├── server.properties
    ├── version_lock.txt
    └── ...
```

---

## Auto Update System

The updater checks the latest Bedrock Dedicated Server build using:

```text
https://mcjarfiles.com/api/get-latest-jar/bedrock/latest/linux
```

If a new version is detected, it downloads and installs automatically without overwriting protected configs.

---

## Graceful Shutdown

Supports Pterodactyl STOP button using SIGTERM.

---

## License

MIT License
