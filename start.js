const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');

// --- CONFIGURATION ---
const API_URL = 'https://mcjarfiles.com/api/get-latest-jar/bedrock/latest/linux';
const SERVER_DIR = path.join(__dirname, 'bedrock_server');
const TEMP_ZIP = path.join(__dirname, 'server_update.zip');
const VERSION_FILE = path.join(SERVER_DIR, 'version_lock.txt');
const PROPERTIES_FILE = path.join(SERVER_DIR, 'server.properties');

const AXIOS_CONFIG = {
    headers: { 
        // Pretend to be a real browser to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    timeout: 15000, // Wait max 15 seconds before timing out
    maxRedirects: 5
};

// Files that will NOT be overwritten during update
const PROTECTED_FILES = [
    'server.properties',
    'permissions.json',
    'allowlist.json',
    'whitelist.json'
];

async function main() {
    console.log('--- Pterodactyl Bedrock Auto-Updater ---');
    
    if (!fs.existsSync(SERVER_DIR)) {
        fs.mkdirSync(SERVER_DIR, { recursive: true });
    }

    try {
        // 1. Check for Updates
        console.log(`Checking remote version from: ${API_URL}`);
        
        // Use the new config with User-Agent and Timeout
        const response = await axios.head(API_URL, AXIOS_CONFIG);
        
        const finalUrl = response.request.res.responseUrl;
        const latestVersion = finalUrl.split('/').pop(); 

        let currentVersion = '';
        if (fs.existsSync(VERSION_FILE)) {
            currentVersion = fs.readFileSync(VERSION_FILE, 'utf8').trim();
        }

        if (currentVersion !== latestVersion) {
            console.log(`Update found! Current: ${currentVersion || 'None'} -> New: ${latestVersion}`);
            await downloadAndUpdate(latestVersion);
        } else {
            console.log('Server is up to date.');
        }

        // 2. Port & IP for Pterodactyl
        syncServerProperties();

        // 3. Start Server
        startServer();

    } catch (error) {
        console.error('Error in updater:', error.message);
        
        // --- FALLBACK LOGIC ---
        // If internet fails (timeout), we still could start the existing bedrock server
        if (fs.existsSync(path.join(SERVER_DIR, 'bedrock_server'))) {
            console.log('⚠️ Network error detected. Skipping update and starting existing server...');
            syncServerProperties();
            startServer();
        } else {
            console.error('❌ CRITICAL: No server files found and download failed. Check your internet connection.');
        }
    }
}

async function downloadAndUpdate(versionString) {
    console.log('Downloading update...');
    const writer = fs.createWriteStream(TEMP_ZIP);
    
    // Apply the config here as well
    const response = await axios({
        url: API_URL, 
        method: 'GET', 
        responseType: 'stream',
        ...AXIOS_CONFIG 
    });
    
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            console.log('Download complete. Extracting...');
            const zip = new AdmZip(TEMP_ZIP);
            const zipEntries = zip.getEntries();

            zipEntries.forEach((entry) => {
                const fileName = entry.entryName;
                // Do not overwrite existing config files
                if (PROTECTED_FILES.includes(fileName) && fs.existsSync(path.join(SERVER_DIR, fileName))) {
                    console.log(`Skipping config: ${fileName}`);
                    return;
                }
                zip.extractEntryTo(entry, SERVER_DIR, true, true);
            });
            
            // Set executable permissions (Required on Linux)
            const execPath = path.join(SERVER_DIR, 'bedrock_server');
            if (fs.existsSync(execPath)) fs.chmodSync(execPath, '755');

            fs.writeFileSync(VERSION_FILE, versionString);
            fs.unlinkSync(TEMP_ZIP);
            console.log('Update finished.');
            resolve();
        });
        writer.on('error', reject);
    });
}

function syncServerProperties() {
    // This function ensures the server runs on the Port assigned by Pterodactyl
    if (!fs.existsSync(PROPERTIES_FILE)) return;

    console.log('Syncing server.properties with Pterodactyl environment...');
    let content = fs.readFileSync(PROPERTIES_FILE, 'utf8');
    
    // Default values from Pterodactyl Environment
    const pteroPort = process.env.SERVER_PORT || 19132;
    const pteroPortV6 = parseInt(pteroPort) + 1; // Usually v6 port is port+1

    // Update server-port
    if (content.includes('server-port=')) {
        content = content.replace(/server-port=.*/g, `server-port=${pteroPort}`);
    } else {
        content += `\nserver-port=${pteroPort}`;
    }

    // Update server-portv6
    if (content.includes('server-portv6=')) {
        content = content.replace(/server-portv6=.*/g, `server-portv6=${pteroPortV6}`);
    } else {
        content += `\nserver-portv6=${pteroPortV6}`;
    }

    fs.writeFileSync(PROPERTIES_FILE, content);
    console.log(`Port synced: ${pteroPort} (v4), ${pteroPortV6} (v6)`);
}

function startServer() {
    console.log('Starting Bedrock Server process...');
    const serverBin = path.join(SERVER_DIR, 'bedrock_server');
    
    // Spawn process inheriting input/output (so Pterodactyl console works)
    const serverProcess = spawn(serverBin, [], {
        cwd: SERVER_DIR,
        stdio: 'inherit',
        env: { ...process.env, LD_LIBRARY_PATH: SERVER_DIR } // Ensure libraries are loaded
    });

    serverProcess.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        process.exit(0);
    });

    // Handle STOP button from Pterodactyl (SIGTERM)
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM from Panel, stopping server gracefully...');
        serverProcess.kill('SIGTERM');
    });
}

main();