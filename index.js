/**
 * Credits & Thanks to
 * Developer = Xyard ( Yard )
 * Lead owner = Rypzi
 * Owner = -
 * Owner = -
 * Designer = Xyard
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * WAJIB MASUK SALURAN ADMIN
 * 
 * Saluran Resmi AlyaMD:
 * https://whatsapp.com/channel/0029Vb8GmCSKgsO1oX9PcJ3m
 * 
 */

const originalConsoleLog = console.log;
console.log = (...args) => {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    if (msg.includes('Closing') && (msg.includes('session') || msg.includes('SessionEntry'))) {
        return;
    }
    if (msg.includes('prekey') || msg.includes('_chains') || msg.includes('registrationId')) {
        return;
    }
    if (msg.includes('Buffer') || msg.includes('chainKey') || msg.includes('ephemeralKeyPair')) {
        return;
    }
    if (msg.includes('rootKey') || msg.includes('indexInfo') || msg.includes('pendingPreKey')) {
        return;
    }
    if (msg.includes('currentRatchet') || msg.includes('baseKey') || msg.includes('privKey')) {
        return;
    }
    originalConsoleLog.apply(console, args);
};

const path = require('path');
const fs = require('fs');
const config = require('./config');
const { startConnection } = require('./src/connection');
const { messageHandler, groupHandler, messageUpdateHandler, groupSettingsHandler } = require('./src/handler');
const { loadPlugins, pluginStore } = require('./src/lib/plugins');
const { initDatabase, getDatabase } = require('./src/lib/database');
const { initScheduler, loadScheduledMessages, startGroupScheduleChecker, startSewaChecker } = require('./src/lib/scheduler');
const { startAutoBackup } = require('./src/lib/backup');
const { handleAntiTagSW } = require('./src/lib/groupProtection');
const { initSholatScheduler } = require('./src/lib/sholatScheduler');
let startOrderPoller = null;
try {
    startOrderPoller = require('./src/lib/orderPoller').startOrderPoller;
} catch (e) {}
const { 
    logger, 
    c, 
    printBanner, 
    printStartup, 
    logConnection, 
    logErrorBox,
    logPlugin,
    divider 
} = require('./src/lib/colors');

/**
 * Waktu start untuk menghitung boot time
 */
const startTime = Date.now();

/**
 * Watcher untuk auto-reload plugins di dev mode
 */
let pluginWatcher = null;
const reloadDebounce = new Map();

/**
 * Memulai file watcher untuk dev mode
 */
function startDevWatcher(pluginsPath) {
    if (pluginWatcher) {
        pluginWatcher.close();
    }
    
    logger.system('Dev Mode', 'Plugin hot reload enabled');
    
    pluginWatcher = fs.watch(pluginsPath, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;
        
        const existingTimeout = reloadDebounce.get(filename);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        const timeout = setTimeout(() => {
            reloadDebounce.delete(filename);
            
            const fullPath = path.join(pluginsPath, filename);
            
            if (!fs.existsSync(fullPath)) {
                logger.warn('File removed', filename);
                return;
            }
            
            try {
                const pluginName = path.basename(filename, '.js');
                delete require.cache[require.resolve(fullPath)];
                
                const plugin = require(fullPath);
                if (plugin.config && plugin.handler) {
                    pluginStore.commands.set(pluginName.toLowerCase(), plugin);
                    logger.success('Reloaded', pluginName);
                }
            } catch (error) {
                logger.error('Reload failed', `${filename}: ${error.message}`);
            }
        }, 500);
        
        reloadDebounce.set(filename, timeout);
    });
    
    logger.debug('Watching', pluginsPath);
}

/**
 * Watcher untuk src/lib dengan hot reload
 */
let srcWatcher = null;

function startSrcWatcher(srcPath) {
    if (srcWatcher) {
        srcWatcher.close();
    }
    
    logger.system('Dev Mode', 'Src hot reload enabled');
    
    srcWatcher = fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;
        
        const existingTimeout = reloadDebounce.get('src_' + filename);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        const timeout = setTimeout(() => {
            reloadDebounce.delete('src_' + filename);
            
            const fullPath = path.join(srcPath, filename);
            
            if (!fs.existsSync(fullPath)) {
                logger.warn('Src file removed', filename);
                return;
            }
            
            try {
                // Clear cache untuk file tersebut
                delete require.cache[require.resolve(fullPath)];
                logger.success('Src reloaded', filename);
            } catch (error) {
                logger.error('Src reload failed', `${filename}: ${error.message}`);
            }
        }, 500);
        
        reloadDebounce.set('src_' + filename, timeout);
    });
    
    logger.debug('Watching', srcPath);
}

/**
 * Setup anti-crash handlers
 */
function setupAntiCrash() {
    process.on('uncaughtException', (error, origin) => {
        logErrorBox('Uncaught Exception', error.message);
        if (config.dev?.debugLog) {
            console.error(c.gray(error.stack));
        }
        logger.info('Bot continues running...');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
        logErrorBox('Unhandled Rejection', String(reason));
        if (config.dev?.debugLog) {
            console.error(c.gray('Promise:'), promise);
        }
        logger.info('Bot continues running...');
    });
    
    process.on('warning', (warning) => {
        logger.warn('Warning', `${warning.name}: ${warning.message}`);
    });
    
    process.on('SIGINT', () => {
        console.log('');
        logger.system('SIGINT received');
        logger.info('Saving data...');
        
        try {
            const { getDatabase } = require('./src/lib/database');
            const db = getDatabase();
            db.save();
            logger.success('Data saved!');
        } catch (error) {
            logger.warn('Save failed', error.message);
        }
        
        logger.info('Bot stopped. Goodbye!');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('');
        logger.system('SIGTERM received');
        process.exit(0);
    });
    
    logger.success('Anti-crash active');
}

/**
 * Fungsi utama untuk memulai bot
 */
async function main() {
    printBanner();
    printStartup({
        name: config.bot?.name || 'Ourin-AI',
        version: config.bot?.version || '1.0.0',
        developer: config.bot?.developer || 'Developer',
        mode: config.mode || 'public'
    });
    setupAntiCrash();
    divider();
    logger.info('Initializing database...');
    const dbPath = path.join(process.cwd(), config.database?.path || './src/database');
    await initDatabase(dbPath);
    logger.success('Database ready!');
    const db = getDatabase();
    const savedMode = db.setting('botMode');
    if (savedMode && (savedMode === 'self' || savedMode === 'public')) {
        config.mode = savedMode;
        logger.info('Bot Mode', `Loaded: ${savedMode}`);
    }
    const savedPremium = db.setting('premiumUsers');
    if (Array.isArray(savedPremium)) {
        config.premiumUsers = savedPremium;
        logger.info('Premium', `Loaded: ${savedPremium.length} users`);
    }
    const savedBanned = db.setting('bannedUsers');
    if (Array.isArray(savedBanned)) {
        config.bannedUsers = savedBanned;
        logger.info('Banned', `Loaded: ${savedBanned.length} users`);
    }
    if (config.backup?.enabled !== false) {
        startAutoBackup(dbPath);
    }
    logger.info('Loading plugins...');

    const pluginsPath = path.join(process.cwd(), 'plugins');
    const pluginCount = loadPlugins(pluginsPath);
    logger.success('Plugins loaded', `${pluginCount} plugins`);
    if (config.dev?.enabled && config.dev?.watchPlugins) {
        startDevWatcher(pluginsPath);
    }
    if (config.dev?.enabled && config.dev?.watchSrc) {
        const srcPath = path.join(process.cwd(), 'src');
        startSrcWatcher(srcPath);
    }
    logger.info('Initializing scheduler...');
    initScheduler(config);
    logger.success('Scheduler ready!');
    const bootTime = Date.now() - startTime;
    logger.info('Boot time', `${bootTime}ms`);
    divider();
    logger.system('Connecting to WhatsApp...');
    console.log('');
    await startConnection({
        onRawMessage: async (msg, sock) => {
            try {
                const db = getDatabase();
                await handleAntiTagSW(msg, sock, db);
            } catch (error) {}
        },
        
        onMessage: async (msg, sock) => {
            try {
                const handlerPromise = messageHandler(msg, sock);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Handler timeout')), 60000)
                );
                await Promise.race([handlerPromise, timeoutPromise]);
            } catch (error) {
                if (error.message !== 'Handler timeout') {
                    logger.error('Handler', error.message);
                    if (config.dev?.debugLog) {
                        console.error(c.gray(error.stack));
                    }
                }
            }
        },
        
        /**
         * Callback saat ada update group
         */
        onGroupUpdate: async (update, sock) => {
            try {
                await groupHandler(update, sock);
            } catch (error) {
                logger.error('Group', error.message);
            }
        },
        
        onMessageUpdate: async (updates, sock) => {
            try {
                await messageUpdateHandler(updates, sock);
            } catch (error) {
                logger.error('MessageUpdate', error.message);
            }
        },
        
        onGroupSettingsUpdate: async (update, sock) => {
            try {
                await groupSettingsHandler(update, sock);
            } catch (error) {
                logger.error('GroupSettings', error.message);
            }
        },
        
        /**
         * Callback saat ada update koneksi
         */
        onConnectionUpdate: async (update, sock) => {
            if (update.connection === 'open') {
                logConnection('connected', sock.user?.name || 'Bot');
                logger.success('Ready to receive messages!');
                loadScheduledMessages(sock);
                startGroupScheduleChecker(sock);
                startSewaChecker(sock);
                initScheduler(config, sock);
                initSholatScheduler(sock);
                if (startOrderPoller) startOrderPoller(sock);
                if (config.dev?.enabled) {
                    logger.system('DEV MODE', 'Active');
                }
                divider();
            }
        }
    });
}

main().catch(error => {
    logErrorBox('Fatal Error', error.message);
    console.error(c.gray(error.stack));
    process.exit(1);
});

