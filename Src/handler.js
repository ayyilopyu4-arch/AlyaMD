/**
 * Credits & Thanks to
 * Developer = Xyard ( Xyard )
 * Lead owner = Rypzi
 * Owner = -
 * Owner = -
 * Designer = Xyarf
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029Vb8GmCSKgsO1oX9PcJ3m
 * 
 */

const config = require('../config');
const { isSelf } = require('../config');
const { serialize } = require('./lib/serialize');
const { getPlugin, getPluginCount, getAllPlugins, pluginStore } = require('./lib/plugins');
const { findSimilarCommands, formatSuggestionMessage } = require('./lib/similarity');
const { getDatabase } = require('./lib/database');
const { formatUptime, createWaitMessage, createErrorMessage } = require('./lib/formatter');
const { getUptime } = require('./connection');
const { logger, logMessage, logCommand, c } = require('./lib/colors');
const { isLid, isLidConverted, lidToJid, convertLidArray, resolveAnyLidToJid, cacheParticipantLids } = require('./lib/lidHelper');
const { hasActiveSession } = require('./lib/gameData');
const { 
    handleAntilink, 
    handleAntiRemove,
    cacheMessageForAntiRemove,
    handleAntilinkGc,
    handleAntilinkAll
} = require('./lib/groupProtection');
const { debounceMessage, getCachedUser, getCachedGroup, getCachedSetting } = require('./lib/performanceOptimizer');
const fs = require("fs")

let checkAfk = null;
let isMuted = null;
let checkSpam = null;
let handleSpamAction = null;
let checkSlowmode = null;
let addXp = null;
let checkLevelUp = null;
let incrementChatCount = null;
let checkStickerCommand = null;

// Antispam delay tracker - users who were detected spamming get 3s delay
const spamDelayTracker = new Map();

try {
    checkAfk = require('../plugins/group/afk').checkAfk;
} catch (e) {}

try {
    isMuted = require('../plugins/group/mute').isMuted;
} catch (e) {}

try {
    const antispamModule = require('../plugins/group/antispam');
    checkSpam = antispamModule.checkSpam;
    handleSpamAction = antispamModule.handleSpamAction;
} catch (e) {}

try {
    checkSlowmode = require('../plugins/group/slowmode').checkSlowmode;
} catch (e) {}

let isToxic = null;
let handleToxicMessage = null;
try {
    const toxicModule = require('../plugins/group/antitoxic');
    isToxic = toxicModule.isToxic;
    handleToxicMessage = toxicModule.handleToxicMessage;
} catch (e) {}

let handleAutoAI = null;
try {
    handleAutoAI = require('./lib/autoaiHandler').handleAutoAI;
} catch (e) {}

let handleAutoDownload = null;
try {
    handleAutoDownload = require('./lib/autoDownload').handleAutoDownload;
} catch (e) {}

try {
    const levelModule = require('../plugins/user/level');
    addXp = levelModule.addXp;
    checkLevelUp = levelModule.checkLevelUp;
} catch (e) {}

try {
    incrementChatCount = require('../plugins/group/totalchat').incrementChatCount;
} catch (e) {}

try {
    checkStickerCommand = require('./lib/stickerCommand').checkStickerCommand;
} catch (e) {}

let detectBot = null;
try {
    detectBot = require('../plugins/group/antibot').detectBot;
} catch (e) {}

let autoStickerHandler = null;
try {
    autoStickerHandler = require('../plugins/group/autosticker').autoStickerHandler;
} catch (e) {}

let autoMediaHandler = null;
try {
    autoMediaHandler = require('../plugins/group/automedia').autoMediaHandler;
} catch (e) {}

/**
 * @typedef {Object} HandlerContext
 * @property {Object} sock - Socket connection
 * @property {Object} m - Serialized message
 * @property {Object} config - Bot configuration
 * @property {Object} db - Database instance
 * @property {number} uptime - Bot uptime
 */

/**
 * Anti-spam map untuk tracking pesan per user
 * @type {Map<string, number>}
 */
const spamMap = new Map();

const gamePlugins = [
    'asahotak', 'tebakkata', 'tebakgambar', 'siapakahaku', 
    'tekateki', 'susunkata', 'caklontong', 'family100',
    'tebakbendera', 'tebakkalimat', 'tebaklirik', 'tebaktebakan', 'tebakkimia',
    'tebakdrakor', 'tebakepep', 'tebakjkt48', 'tebakmakanan', 'quizbattle'
];

// Pre-cache game plugins at startup for performance
const cachedGamePlugins = new Map();
for (const gameName of gamePlugins) {
    try {
        const plugin = require(`../plugins/game/${gameName}`);
        if (plugin.answerHandler) cachedGamePlugins.set(gameName, plugin);
    } catch (e) {}
}

let sulapPlugin = null;
try {
    sulapPlugin = require('../plugins/fun/sulap');
} catch (e) {}

async function handleGameAnswer(m, sock) {
    try {
        try {
            const sulapPlugin = require('../plugins/fun/sulap');
            if (sulapPlugin?.answerHandler) {
                const handled = await sulapPlugin.answerHandler(m, sock);
                if (handled) return true;
            }
        } catch (e) {}
        
        for (const [, gamePlugin] of cachedGamePlugins) {
            const handled = await gamePlugin.answerHandler(m, sock);
            if (handled) return true;
        }
    } catch (error) {}
    return false;
}

async function handleSmartTriggers(m, sock, db) {
    if (m.isCommand) return false
    if (!m.body) return false
    
    const globalSmartTriggers = db.setting('smartTriggers') ?? config.features?.smartTriggers ?? false
    
    try {
        const text = m.body.trim().toLowerCase()
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        const botName = config.bot?.name || 'Ourin-AI'
        
        let isAutoreplyEnabled = globalSmartTriggers
        const timeHelper = require('./lib/timeHelper')
        
        const processCustomReply = async (replyItem) => {
            let replyText = replyItem.reply
                .replace(/{name}/g, m.pushName || 'User')
                .replace(/{tag}/g, `@${m.sender.split('@')[0]}`)
                .replace(/{sender}/g, m.sender.split('@')[0])
                .replace(/{botname}/g, config.bot?.name || 'Bot')
                .replace(/{time}/g, timeHelper.formatTime('HH:mm:ss'))
                .replace(/{date}/g, timeHelper.formatDate('DD MMMM YYYY'))
            
            const mentions = replyText.includes(`@${m.sender.split('@')[0]}`) ? [m.sender] : []
            
            await sock.sendMessage(m.chat, { 
                text: replyText,
                mentions: mentions
            }, { quoted: m })
            return true
        }
        
        if (m.isGroup) {
            const groupData = db.getGroup(m.chat) || {}
            isAutoreplyEnabled = groupData.autoreply ?? globalSmartTriggers
            
            if (!isAutoreplyEnabled) return false
            
            const customReplies = groupData.customReplies || []
            for (const replyItem of customReplies) {
                if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
                    return await processCustomReply(replyItem)
                }
            }
        } else {
            const privateAutoreply = db.setting('autoreplyPrivate') ?? false
            if (!privateAutoreply && !globalSmartTriggers) return false
            isAutoreplyEnabled = privateAutoreply || globalSmartTriggers
            
            if (isAutoreplyEnabled) {
                const globalCustomReplies = db.setting('globalCustomReplies') || []
                for (const replyItem of globalCustomReplies) {
                    if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
                        return await processCustomReply(replyItem)
                    }
                }
            }
        }
        
        if (!isAutoreplyEnabled) return false
        
        const botJid = sock.user?.id
        const isMentioned = m.mentionedJid?.some(jid => 
            jid === botJid || jid?.includes(sock.user?.id?.split(':')[0])
        )
        
        let thumbBuffer = null
        const thumbPath = './assets/images/ourin2.jpg'
        try {
            if (fs.existsSync(thumbPath)) {
                thumbBuffer = fs.readFileSync(thumbPath)
            }
        } catch (e) {}
        
        const contextInfos = {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
        
        if (thumbBuffer) {
            contextInfos.externalAdReply = {
                title: botName,
                body: config.bot?.version ? `v${config.bot.version}` : null,
                thumbnail: thumbBuffer,
                mediaType: 1,
                sourceUrl: config.saluran?.link || 'https://wa.me/6281277777777',
                renderLargerThumbnail: false
            }
        }
        
        if (isMentioned) {
            await sock.sendMessage(m.chat, {
                text: `👋 *ʜᴀɪ!*\n\n` +
                    `> Ada yang manggil ${botName}?\n` +
                    `> Ketik \`.menu\` untuk melihat fitur!\n\n` +
                    `> _${botName} siap membantu! ✨_`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
        
        if (text?.toLowerCase() === 'p') {
            await sock.sendMessage(m.chat, {
                text: `💬 *ʜᴀɪ @${m.sender.split('@')[0]}!*\n\n` +
                    `> Budayakan salam sebelum\n` +
                    `> memulai percakapan! 🙏\n\n` +
                    `> _Contoh: Assalamualaikum, Halo, dll_`,
                mentions: [m.sender],
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
        
        if (text?.toLowerCase() === 'bot' || text?.toLowerCase().includes('ourin')) {
            await sock.sendMessage(m.chat, {
                text: `🤖 *ʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
                    `> ${botName} online dan siap!\n` +
                    `> Ketik \`.menu\` untuk melihat fitur\n\n` +
                    `> _Response time: < 1s ⚡_`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }

        if(text?.toLowerCase()?.includes("assalamualaikum")) {
            await sock.sendMessage(m.chat, {
                text: `Waaalaikumssalam saudaraku`,
                contextInfo: contextInfos
            }, { quoted: m })
            return true
        }
    } catch (error) {
        console.error('[SmartTriggers] Error:', error.message)
    }
    
    return false
}

/**
 * Cek apakah user sedang spam
 * @param {string} jid - JID user
 * @returns {boolean} True jika sedang spam
 */
function isSpamming(jid) {
    if (!config.features?.antiSpam) return false;
    
    const now = Date.now();
    const lastMessage = spamMap.get(jid) || 0;
    const interval = config.features?.antiSpamInterval || 3000;
    
    if (now - lastMessage < interval) {
        return true;
    }
    
    spamMap.set(jid, now);
    return false;
}

/**
 * Cek permission untuk menjalankan command
 * @param {Object} m - Serialized message
 * @param {Object} pluginConfig - Konfigurasi plugin
 * @returns {{allowed: boolean, reason: string}} Object dengan status dan alasan
 */
function checkPermission(m, pluginConfig) {
    if (pluginConfig.isOwner && !m.isOwner) {
        return { allowed: false, reason: config.messages?.ownerOnly || '🚫 Owner only!' };
    }
    
    if (pluginConfig.isPremium && !m.isPremium && !m.isOwner) {
        return { allowed: false, reason: config.messages?.premiumOnly || '💎 Premium only!' };
    }
    
    if (pluginConfig.isGroup && !m.isGroup) {
        return { allowed: false, reason: config.messages?.groupOnly || '👥 Group only!' };
    }
    
    if (pluginConfig.isPrivate && m.isGroup) {
        return { allowed: false, reason: config.messages?.privateOnly || '📱 Private chat only!' };
    }
    
    if (pluginConfig.isAdmin && m.isGroup && !m.isAdmin && !m.isOwner) {
        return { allowed: false, reason: config.messages?.adminOnly || '👮 Admin grup only!' };
    }
    
    if (pluginConfig.isBotAdmin && m.isGroup && !m.isBotAdmin) {
        return { allowed: false, reason: config.messages?.botAdminOnly || '🤖 Bot harus menjadi admin grup!' };
    }
    
    return { allowed: true, reason: '' };
}

/**
 * Cek mode bot dengan validasi kuat
 * @param {Object} m - Serialized message
 * @returns {boolean} True jika boleh diproses
 */
function checkMode(m) {
    const db = getDatabase()
    const realConfig = require('../config')
    const dbMode = db.setting('botMode')
    const mode = dbMode || realConfig.config.mode || 'public'
    
    const onlyGc = db.setting('onlyGc')
    const onlyPc = db.setting('onlyPc')
    const selfAdmin = db.setting('selfAdmin')
    const publicAdmin = db.setting('publicAdmin')
    const botAfk = db.setting('botAfk')
    
    if (botAfk && botAfk.active) {
        if (m.fromMe || m.isOwner) {
            return { allowed: true }
        }
        const duration = formatAfkDuration(Date.now() - botAfk.since)
        return { 
            allowed: false, 
            isAfk: true,
            afkMessage: `💤 *ʙᴏᴛ sᴇᴅᴀɴɢ ᴀꜰᴋ*\n\n` +
                `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                `┃ 📝 ᴀʟᴀsᴀɴ: \`${botAfk.reason || 'AFK'}\`\n` +
                `┃ ⏱️ sᴇᴊᴀᴋ: \`${duration}\` yang lalu\n` +
                `╰┈┈⬡\n\n` +
                `> Bot tidak bisa menerima perintah saat ini\n` +
                `> Mohon tunggu sampai owner mengaktifkan kembali`
        }
    }
    
    if (onlyGc && !m.isGroup && !m.isOwner) {
        return { allowed: false }
    }
    
    if (onlyPc && m.isGroup && !m.isOwner) {
        return { allowed: false }
    }
    
    if (mode === 'self') {
        if (m.fromMe) return { allowed: true }
        if (m.isOwner) return { allowed: true }
        return { allowed: false }
    }
    
    if (mode === 'public') {
        if (selfAdmin) {
            if (m.fromMe || m.isOwner) return { allowed: true }
            if (m.isGroup && m.isAdmin) return { allowed: true }
            return { allowed: false }
        }
        
        if (publicAdmin) {
            if (m.fromMe || m.isOwner) return { allowed: true }
            if (!m.isGroup) return { allowed: true }
            if (m.isGroup && m.isAdmin) return { allowed: true }
            return { allowed: false }
        }
        
        return { allowed: true }
    }
    
    return { allowed: true }
}

function formatAfkDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} hari ${hours % 24} jam`
    if (hours > 0) return `${hours} jam ${minutes % 60} menit`
    if (minutes > 0) return `${minutes} menit`
    return `${seconds} detik`
}


/**
 * Handler utama untuk memproses pesan
 * @param {Object} msg - Raw message dari Baileys
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 * @example
 * sock.ev.on('messages.upsert', async ({ messages }) => {
 *   await messageHandler(messages[0], sock);
 * });
 */
async function messageHandler(msg, sock) {
    try {
        const m = await serialize(sock, msg);
        
        if (!m) return;
        if (!m.message) return;
        const db = getDatabase();
        if (!db?.ready) {
            return;
        }
        
        if (m.isGroup && m.isBotAdmin && !m.isAdmin && !m.isOwner && isMuted) {
            try {
                const isMutedResult = isMuted(m.chat, m.sender, db)
                if (isMutedResult) {
                    await sock.sendMessage(m.chat, { delete: m.key })
                    return
                }
            } catch (e) {}
        }
        
        const modeCheck = checkMode(m)
        if (!modeCheck.allowed) {
            if (modeCheck.isAfk && m.isCommand) {
                await m.reply(modeCheck.afkMessage)
            }
            return; 
        }
        
        if (m.isBanned) {
            logger.warn('Banned user', m.sender);
            return;
        }
        
        const msgKey = `${m.chat}_${m.sender}_${m.id}`;
        if (debounceMessage(msgKey)) {
            return;
        }
        
        if (config.features?.autoRead) {
            sock.readMessages([m.key]).catch(() => {});
        }
        if (!m.pushName || m.pushName === 'Unknown' || m.pushName.trim() === '') {
            if (!m.isCommand && !m.isBot && !m.fromMe) {
                return;
            }
            m.pushName = m.sender?.split('@')[0] || 'User';
        }
        
        db.setUser(m.sender, {
            name: m.pushName,
            lastSeen: new Date().toISOString()
        });
        
        if (m.isGroup && incrementChatCount) {
            try {
                incrementChatCount(m.chat, m.sender, db)
            } catch (e) {}
        }
        
        if (config.features?.logMessage) {
            let groupName = 'PRIVATE';
            if (m.isGroup) {
                const groupData = db.getGroup(m.chat);
                groupName = groupData?.name || 'Unknown Group';
                // Fetch metadata async without blocking - don't await
                if (groupName === 'Unknown Group' || groupName === 'Unknown') {
                    sock.groupMetadata(m.chat).then(meta => {
                        if (meta?.subject) db.setGroup(m.chat, { name: meta.subject });
                    }).catch(() => {});
                }
            }

            logMessage({
                chatType: m.isGroup ? 'group' : 'private',
                groupName: groupName,
                pushName: m.pushName,
                sender: m.sender,
                message: m.body
            });
        }
        
        if (checkAfk) {
            checkAfk(m, sock).catch(() => {});
        }
        
        if (m.isGroup) {
            cacheMessageForAntiRemove(m, sock, db)
            
            const antilinkTriggered = await handleAntilink(m, sock, db)
            if (antilinkTriggered) return
            
            const antilinkGcTriggered = await handleAntilinkGc(m, sock, db)
            if (antilinkGcTriggered) return
            
            const antilinkAllTriggered = await handleAntilinkAll(m, sock, db)
            if (antilinkAllTriggered) return
            
            const groupData = db.getGroup(m.chat) || {}
            if (groupData.autoforward && !m.isCommand && !m.fromMe && !m.key?.fromMe && m.message) {
                try {
                    const mtype = Object.keys(m.message || {})[0]
                    if (mtype && !mtype.includes('protocolMessage') && !mtype.includes('senderKeyDistribution')) {
                        await sock.sendMessage(m.chat, { 
                            forward: m,
                            contextInfo: {
                                isForwarded: true,
                                forwardingScore: 1
                            }
                        }, { quoted: m }).catch(() => {})
                    }
                } catch (e) {}
            }
            
            if (detectBot && !m.isOwner && !m.isAdmin) {
                try {
                    const botDetected = await detectBot(m, sock)
                    if (botDetected) {
                        if (config.dev?.debugLog) logger.info('AntiBot', `Bot detected and kicked: ${m.sender}`)
                        return
                    }
                } catch (e) {
                    if (config.dev?.debugLog) logger.error('AntiBot', e.message)
                }
            }
            
            if (handleAutoDownload && m.body) {
                handleAutoDownload(m, sock, m.body).catch(e => {
                    if (config.dev?.debugLog) logger.error('AutoDL', e.message)
                });
            }
            if (isMuted && m.isBotAdmin && !m.isAdmi
