const config = require('../../config');
const { formatUptime, getTimeGreeting } = require('../../src/lib/formatter');
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins');
const { getDatabase } = require('../../src/lib/database');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateWAMessageFromContent, proto } = require('ourin');
/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEKS
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 * 
 */
const pluginConfig = {
    name: 'menu',
    alias: ['help', 'bantuan', 'commands', 'm'],
    category: 'main',
    description: 'Menampilkan menu utama bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
};

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', linode: '☁️', random: '🎲', canvas: '🎨', vps: '🌊'
};

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('');
}

function formatTime(date) {
    const timeHelper = require('../../src/lib/timeHelper');
    return timeHelper.formatTime('HH:mm');
}

function formatDateShort(date) {
    const timeHelper = require('../../src/lib/timeHelper');
    return timeHelper.formatFull('dddd, DD MMMM YYYY');
}

function buildMenuText(m, botConfig, db, uptime, botMode = 'md') {
    const prefix = botConfig.command?.prefix || '.';
    const user = db.getUser(m.sender);
    const timeHelper = require('../../src/lib/timeHelper');
    const timeStr = timeHelper.formatTime('HH:mm');
    const dateStr = timeHelper.formatFull('dddd, DD MMMM YYYY');
    
    const categories = getCategories();
    const commandsByCategory = getCommandsByCategory();
    
    let totalCommands = 0;
    for (const category of categories) {
        totalCommands += (commandsByCategory[category] || []).length;
    }
    
    let userRole = 'User', roleEmoji = '👤';
    if (m.isOwner) { userRole = 'Owner'; roleEmoji = '👑'; }
    else if (m.isPremium) { userRole = 'Premium'; roleEmoji = '💎'; }
    
    const greeting = getTimeGreeting();
    const uptimeFormatted = formatUptime(uptime);
    const totalUsers = db.getUserCount();
    const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
    
    let txt = '';
    txt += `${greetEmoji} *Halo ${m.pushName}! ${greeting}*
\n`
    txt += `> ${botConfig.bot?.name} ᴀᴅᴀʟᴀʜ ʙᴏᴛ ᴀᴛᴀᴜ ᴘʀᴏɢʀᴀᴍ ᴏᴛᴏᴍᴀᴛɪꜱ ʏᴀɴɢ ʙᴇʀᴊᴀʟᴀɴ ᴅɪ ᴡʜᴀᴛꜱᴀᴘᴘ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ꜰɪᴛᴜʀ ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ. ꜰɪᴛᴜʀ ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ ᴍᴇᴍᴜɴɢᴋɪɴᴋᴀɴ ᴀᴋᴜɴ ᴡʜᴀᴛꜱᴀᴘᴘ ᴜᴛᴀᴍᴀ ᴛᴇʀʜᴜʙᴜɴɢ ᴋᴇ ʙᴇʙᴇʀᴀᴘᴀ ᴘᴇʀᴀɴɢᴋᴀᴛ ꜱᴇᴄᴀʀᴀ ʙᴇʀꜱᴀᴍᴀᴀɴ ᴛᴀɴᴘᴀ ᴘᴇʀʟᴜ ꜱᴇʟᴀʟᴜ ᴛᴇʀʜᴜʙᴜɴɢ ᴅɪ ꜱᴍᴀʀᴛᴘʜᴏɴᴇ\n\n`
    txt += `🤖 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`;
    txt += `◦ ɴᴀᴍᴀ: *${botConfig.bot?.name || 'Ourin-AI'}*\n`;
    txt += `◦ ᴠᴇʀsɪ: *v${botConfig.bot?.version || '1.2.0'}*\n`;
    txt += `◦ ᴍᴏᴅᴇ: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
    txt += `◦ ᴘʀᴇꜰɪx: *[ ${prefix} ]*\n`;
    txt += `◦ ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n`;
    txt += `◦ ᴛᴏᴛᴀʟ ᴜsᴇʀ: *${totalUsers}*\n`;
    txt += `◦ ɢʀᴏᴜᴘ ᴍᴏᴅᴇ: *${botMode.toUpperCase()}*\n`;
    txt += `◦ ᴏᴡɴᴇʀ: *${botConfig.owner?.name || 'Ourin-AI'}*\n`;
    txt += `\n`;
    
    txt += ` 👤 *ᴜsᴇʀ ɪɴꜰᴏ* 」\n`;
    txt += `◦ ɴᴀᴍᴀ: *${m.pushName}*\n`;
    txt += `◦ ʀᴏʟᴇ: *${roleEmoji} ${userRole}*\n`;
    txt += `◦ ʟɪᴍɪᴛ: *${m.isOwner || m.isPremium ? '∞ Unlimited' : (user?.limit ?? 25)}*\n`;
    txt += `◦ ᴡᴀᴋᴛᴜ: *${timeStr} WIB*\n`;
    txt += `◦ ᴛᴀɴɢɢᴀʟ: *${dateStr}*\n`;
    txt += `\n`;
    
    const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];
    const sortedCategories = [...categories].sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    if (botMode === 'cpanel') {
        const pteroConfig = config.pterodactyl || {};
        const { getAccessibleServers, VALID_SERVERS } = require('../../src/lib/cpanelRoles');
        
        const getStatus = (cfg) => (cfg?.domain && cfg?.apikey) ? '✅' : '❌';
        const s1Status = getStatus(pteroConfig?.server1);
        const s2Status = getStatus(pteroConfig?.server2);
        const s3Status = getStatus(pteroConfig?.server3);
        const s4Status = getStatus(pteroConfig?.server4);
        const s5Status = getStatus(pteroConfig?.server5);
        
        const userServers = getAccessibleServers(m.sender);
        const userRoleList = userServers.map(s => `${s.server.toUpperCase()}:${s.role}`).join(', ') || 'Tidak ada';
        
        txt += `🖥️ *ᴄᴘᴀɴᴇʟ ᴍᴇɴᴜ v2.0*\n\n`
        txt += `> V1:${s1Status} V2:${s2Status} V3:${s3Status} V4:${s4Status} V5:${s5Status}\n`
        txt += `> Role: *${m.isOwner ? 'Bot Owner' : userRoleList}*\n\n`
        
        txt += `╭─「 📦 *ᴄʀᴇᴀᴛᴇ sᴇʀᴠᴇʀ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}1gb${ver}\` - \`${prefix}10gb${ver}\` | \`${prefix}unli${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
        
        txt += `╭─「 👑 *ᴏᴡɴᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}addowner${ver}\` | \`${prefix}delowner${ver}\` | \`${prefix}listowner${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
        
        txt += `╭─「 🎯 *ᴄᴇᴏ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}addceo${ver}\` | \`${prefix}delceo${ver}\` | \`${prefix}listceo${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
        
        txt += `╭─「 👥 *ʀᴇsᴇʟʟᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}addreseller${ver}\` | \`${prefix}delreseller${ver}\` | \`${prefix}listreseller${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
        
        txt += `╭─「 🔐 *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}cadmin${ver}\` | \`${prefix}deladmin${ver}\` | \`${prefix}listadmin${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
        
        txt += `╭─「 🖥️ *sᴇʀᴠᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}listserver${ver}\` | \`${prefix}delserver${ver}\` | \`${prefix}serverinfo${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
        
        txt += `╭─「 👤 *ᴜsᴇʀ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ* 」\n`
        for (const ver of VALID_SERVERS) {
            txt += `┃ \`${prefix}listuser${ver}\`\n`
        }
        txt += `╰───────────────\n\n`
            
            const doConfig = config.digitalocean || {}
            const doHasToken = doConfig.token ? '✅' : '❌'
            
            txt += `╭─「 🌊 *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ᴠᴘs* 」\n`
            txt += `┃ Status: ${doHasToken} Token\n`
            txt += `┃\n`
            txt += `┃ 📦 *ᴄʀᴇᴀᴛᴇ ᴠᴘs:*\n`
            txt += `┃ \`${prefix}vps1g1c\` - 1GB/1CPU\n`
            txt += `┃ \`${prefix}vps2g1c\` - 2GB/1CPU\n`
            txt += `┃ \`${prefix}vps4g2c\` - 4GB/2CPU\n`
            txt += `┃ \`${prefix}vps8g4c\` - 8GB/4CPU\n`
            txt += `┃\n`
            txt += `┃ 🔧 *ᴍᴀɴᴀɢᴇ:*\n`
            txt += `┃ \`${prefix}listvps\` - List droplet\n`
            txt += `┃ \`${prefix}cekvps\` - Cek detail\n`
            txt += `┃ \`${prefix}delvps\` - Hapus VPS\n`
            txt += `┃ \`${prefix}sisavps\` - Cek kuota\n`
            txt += `┃\n`
            txt += `┃ ⚡ *ᴋᴏɴᴛʀᴏʟ:*\n`
            txt += `┃ \`${prefix}turnon\` - Hidupkan\n`
            txt += `┃ \`${prefix}turnoff\` - Matikan\n`
            txt += `┃ \`${prefix}restartvps\` - Restart\n`
            txt += `╰───────────────\n\n`
        
        const cpanelAllowed = ['main', 'group', 'sticker', 'owner', 'tools', 'linode', 'vps'];
        for (const category of sortedCategories) {
            if (category === 'owner' && !m.isOwner) continue;
            if (category === 'panel') continue;
            if (!cpanelAllowed.includes(category.toLowerCase())) continue;
            const commands = commandsByCategory[category] || [];
            if (commands.length === 0) continue;
            
            const emoji = CATEGORY_EMOJIS[category] || '📋';
            const categoryName = toSmallCaps(category);
            
            txt += `╭┈┈⬡「 ${emoji} *${categoryName}* 」\n`;
            for (const cmd of commands) {
                txt += `┃ ◦ \`${prefix}${toSmallCaps(cmd)}\`\n`;
            }
            txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
        }
    } else {
        const modeAllowedMap = {
            md: null,
            store: ['main', 'group', 'sticker', 'owner', 'store'],
            pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
        };
        const modeExcludeMap = {
            md: ['panel', 'pushkontak', 'store'],
            store: null,
            pushkontak: null
        };
        
        const allowedCategories = modeAllowedMap[botMode];
        const excludeCategories = modeExcludeMap[botMode] || [];
        
        for (const category of sortedCategories) {
            if (category === 'owner' && !m.isOwner) continue;
            
            if (allowedCategories && !allowedCategories.includes(category.toLowerCase())) continue;
            if (excludeCategories && excludeCategories.includes(category.toLowerCase())) continue;
            
            const commands = commandsByCategory[category] || [];
            if (commands.length === 0) continue;
            
            const emoji = CATEGORY_EMOJIS[category] || '📋';
            const categoryName = toSmallCaps(category);
            
            txt += `╭┈┈⬡「 ${emoji} *${categoryName}* 」\n`;
            for (const cmd of commands) {
                txt += `┃ ◦ \`${prefix}${toSmallCaps(cmd)}\`\n`;
            }
            txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
        }
    }
    
    txt += `_© ${botConfig.bot?.name || 'Ourin-AI'} | ${new Date().getFullYear()}_\n`;
    txt += `_ᴅᴇᴠᴇʟᴏᴘᴇʀ: ${botConfig.bot?.developer || 'Lucky Archz'}_`;
    
    return txt;
}

function getContextInfo(botConfig, m, thumbBuffer, renderLargerThumbnail = false) {
    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
    const saluranLink = botConfig.saluran?.link || '';
    
    const ctx = {
        mentionedJid: [m.sender],
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: botConfig.bot?.name || 'Ourin-AI',
            body: `ᴠ${botConfig.bot?.version || '1.2.0'} • ${(botConfig.mode || 'public').toUpperCase()}`,
            sourceUrl: saluranLink,
            mediaType: 1,
            showAdAttribution: false,
            renderLargerThumbnail
        }
    };
    
    if (thumbBuffer) ctx.externalAdReply.thumbnail = thumbBuffer;
    return ctx;
}

function getVerifiedQuoted(botConfig) {
    const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
    const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
    
    return {
        key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
        message: {
            extendedTextMessage: {
                text: `✨ *${botConfig.bot?.name || 'Ourin-AI'}* ✨\nꜰᴀsᴛ ʀᴇsᴘᴏɴsᴇ ʙᴏᴛ`,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 9999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            }
        }
    };
}

async function handler(m, { sock, config: botConfig, db, uptime }) {
    const savedVariant = db.setting('menuVariant');
    const menuVariant = savedVariant || botConfig.ui?.menuVariant || 2;
    const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {};
    const botMode = groupData.botMode || 'md';
    const text = buildMenuText(m, botConfig, db, uptime, botMode);
    
    const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg');
    const videoPath = path.join(process.cwd(), 'assets', 'video', 'ourin.mp4');
    
    let imageBuffer = fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null;
    let thumbBuffer = fs.existsSync(thumbPath) ? fs.readFileSync(thumbPath) : null;
    let videoBuffer = fs.existsSync(videoPath) ? fs.readFileSync(videoPath) : null;
    
    try {
        switch (menuVariant) {
            case 1:
                if (imageBuffer) {
                    await sock.sendMessage(m.chat, { image: imageBuffer, caption: text });
                } else {
                    await m.reply(text);
                }
                break;
                
            case 2:
                const msgV2 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                if (imageBuffer) {
                    msgV2.image = imageBuffer;
                    msgV2.caption = text;
                } else {
                    msgV2.text = text;
                }
                await sock.sendMessage(m.chat, msgV2, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 3:
                let resizedThumb = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        resizedThumb = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        resizedThumb = thumbBuffer;
                    }
                }
                
                let contextThumb = thumbBuffer;
                try {
                    const ourinPath = path.join(process.cwd(), 'assets', 'images', 'ourin.jpg');
                    if (fs.existsSync(ourinPath)) {
                        contextThumb = fs.readFileSync(ourinPath);
                    }
                } catch (e) {}
                
                await sock.sendMessage(m.chat, {
                    document: imageBuffer || Buffer.from(''),
                    mimetype: 'image/png',
                    fileLength: 999999999999,
                    fileSize: 999999999999,
                    fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                    caption: text,
                    jpegThumbnail: resizedThumb,
                    contextInfo: getContextInfo(botConfig, m, contextThumb, true)
                }, { quoted: getVerifiedQuoted(botConfig) });
                break;
                
            case 4:
                if (videoBuffer) {
                    await sock.sendMessage(m.chat, {
                        video: videoBuffer,
                        caption: text,
                        gifPlayback: true,
                        contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                    }, { quoted: getVerifiedQuoted(botConfig) });
                } else {
                    const fallback = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallback.image = imageBuffer; fallback.caption = text; }
                    else { fallback.text = text; }
                    await sock.sendMessage(m.chat, fallback, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 5:
                const prefix = botConfig.command?.prefix || '.';
                const saluranId = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranName = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                
                const categories = getCategories();
                const commandsByCategory = getCommandsByCategory();
                const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'jpm', 'pushkontak', 'panel', 'user'];
                
                const sortedCats = [...categories].sort((a, b) => {
                    const indexA = categoryOrder.indexOf(a);
                    const indexB = categoryOrder.indexOf(b);
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                });
                
                const toMonoUpperBold = (text) => {
                    const chars = {
                        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
                        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
                        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
                        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
                    };
                    return text.toUpperCase().split('').map(c => chars[c] || c).join('');
                };
                
                const categoryRows = [];
                
                const modeAllowedMap = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeMap = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null,
                    store: null,
                    pushkontak: null
                };
                
                const allowedCats = modeAllowedMap[botMode];
                const excludeCats = modeExcludeMap[botMode] || [];
                
                for (const cat of sortedCats) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowedCats && !allowedCats.includes(cat.toLowerCase())) continue;
                    if (excludeCats && excludeCats.includes(cat.toLowerCase())) continue;
                    
                    const cmds = commandsByCategory[cat] || [];
                    if (cmds.length === 0) continue;
                    
                    const emoji = CATEGORY_EMOJIS[cat] || '📁';
                    const title = `${emoji} ${toMonoUpperBold(cat)}`;
                    
                    categoryRows.push({
                        title: title,
                        id: `${prefix}menucat ${cat}`,
                        description: `${cmds.length} commands`
                    });
                }
                
                let totalCmds = 0;
                for (const cat of categories) {
                    totalCmds += (commandsByCategory[cat] || []).length;
                }
                
                const now = new Date();
                const greeting = getTimeGreeting();
                const greetEmoji = greeting.includes('pagi') ? '🌅' : greeting.includes('siang') ? '☀️' : greeting.includes('sore') ? '🌇' : '🌙';
                const uptimeFormatted = formatUptime(uptime);
                
                let headerText = `${greetEmoji} *ʜᴀʟʟᴏ, @${m.sender.split('@')[0]}!*\n\n`;
                headerText += `> *${greeting}!* sᴇʟᴀᴍᴀᴛ ᴅᴀᴛᴀɴɢ ᴅɪ *${botConfig.bot?.name || 'Ourin-AI'}* ✨\n\n`;
                headerText += `╭┈┈⬡「 🤖 *ʙᴏᴛ ɪɴꜰᴏ* 」\n`;
                headerText += `┃ ◦ ɴᴀᴍᴀ: *${botConfig.bot?.name || 'Ourin-AI'}*\n`;
                headerText += `┃ ◦ ᴠᴇʀsɪ: *v${botConfig.bot?.version || '1.2.0'}*\n`;
                headerText += `┃ ◦ ᴍᴏᴅᴇ: *${(botConfig.mode || 'public').toUpperCase()}*\n`;
                headerText += `┃ ◦ ᴜᴘᴛɪᴍᴇ: *${uptimeFormatted}*\n`;
                headerText += `┃ ◦ ᴛᴏᴛᴀʟ ᴄᴍᴅ: *${totalCmds}*\n`;
                headerText += `╰┈┈┈┈┈┈┈┈⬡\n\n`;
                headerText += `> 📋 *Pilih kategori di bawah untuk melihat daftar command*`;
                
                try {
                    const { generateWAMessageFromContent, proto } = require('ourin');
                    
                    const buttons = [
                        {
                            name: 'single_select',
                            buttonParamsJson: JSON.stringify({
                                title: '📁 ᴘɪʟɪʜ ᴍᴇɴᴜ',
                                sections: [{
                                    title: '📋 ᴘɪʟɪʜ ᴍᴇɴᴜ',
                                    rows: categoryRows
                                }]
                            })
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📊 ᴛᴏᴛᴀʟ ᴘɪᴛᴜʀ',
                                id: `${prefix}totalfitur`
                            })
                        }
                    ];
                    
                    let headerMedia = null;
                    if (imageBuffer) {
                        try {
                            const { prepareWAMessageMedia } = require('ourin');
                            headerMedia = await prepareWAMessageMedia({
                                image: imageBuffer
                            }, {
                                upload: sock.waUploadToServer
                            });
                        } catch (e) {}
                    }
                    
                    const msg = generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: headerText
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `© ${botConfig.bot?.name || 'Ourin-AI'} | ${sortedCats.length} Categories`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.fromObject({
                                        title: `${botConfig.bot?.name || 'Ourin-AI'}`,
                                        hasMediaAttachment: !!headerMedia,
                                        ...(headerMedia || {})
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                        buttons: buttons
                                    }),
                                    contextInfo: {
                                        mentionedJid: [m.sender],
                                        forwardingScore: 9999,
                                        isForwarded: true,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: saluranId,
                                            newsletterName: saluranName,
                                            serverMessageId: 127
                                        }
                                    }
                                })
                            }
                        }
                    }, { userJid: m.sender, quoted: getVerifiedQuoted(botConfig) });
                    
                    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
                    
                } catch (btnError) {
                    console.error('[Menu V5] Button error:', btnError.message);
                    
                    let catListText = `📋 *ᴋᴀᴛᴇɢᴏʀɪ ᴍᴇɴᴜ*\n\n`;
                    for (const cat of sortedCats) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        const cmds = commandsByCategory[cat] || [];
                        if (cmds.length === 0) continue;
                        const emoji = CATEGORY_EMOJIS[cat] || '📁';
                        catListText += `> ${emoji} \`${prefix}menucat ${cat}\` - ${toMonoUpperBold(cat)} (${cmds.length})\n`;
                    }
                    catListText += `\n_Ketik perintah kategori untuk melihat command_`;
                    
                    const fallbackMsg = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackMsg.image = imageBuffer; fallbackMsg.caption = headerText + '\n\n' + catListText; }
                    else { fallbackMsg.text = headerText + '\n\n' + catListText; }
                    await sock.sendMessage(m.chat, fallbackMsg, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 6:
                const thumbPathV6 = path.join(process.cwd(), 'assets', 'images', 'ourin3.jpg');
                const saluranIdV6 = botConfig.saluran?.id || '120363208449943317@newsletter';
                const saluranNameV6 = botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI';
                const saluranLinkV6 = botConfig.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t';
                
                let bannerThumbV6 = null;
                
                try {
                    const sourceBuffer = fs.existsSync(thumbPathV6) 
                        ? fs.readFileSync(thumbPathV6) 
                        : (thumbBuffer || imageBuffer);
                    
                    if (sourceBuffer) {
                        bannerThumbV6 = await sharp(sourceBuffer)
                            .resize(200, 200, { fit: 'inside' })
                            .jpeg({ quality: 90 })
                            .toBuffer();
                    }
                } catch (resizeErr) {
                    console.error('[Menu V6] Resize error:', resizeErr.message);
                    bannerThumbV6 = thumbBuffer;
                }
                
                const contextInfoV6 = {
                    mentionedJid: [m.sender],
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranIdV6,
                        newsletterName: saluranNameV6,
                        serverMessageId: 127
                    },
                    externalAdReply: {
                        title: botConfig.bot?.name || 'Ourin-AI',
                        body: `v${botConfig.bot?.version || '1.0.1'} • Fast Response Bot`,
                        sourceUrl: saluranLinkV6,
                        mediaType: 1,
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                        thumbnail: thumbBuffer || imageBuffer
                    }
                };
                
                try {
                    await sock.sendMessage(m.chat, {
                        document: imageBuffer || Buffer.from('Ourin-AI Menu'),
                        mimetype: 'application/pdf',
                        fileName: `ɴᴏ ᴘᴀɪɴ ɴᴏ ɢᴀɪɴ`,
                        fileLength: 9999999999,
                        caption: text,
                        jpegThumbnail: bannerThumbV6,
                        contextInfo: contextInfoV6
                    }, { quoted: getVerifiedQuoted(botConfig) });
                    
                } catch (v6Error) {
                    console.error('[Menu V6] Error:', v6Error.message);
                    const fallbackV6 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV6.image = imageBuffer; fallbackV6.caption = text; }
                    else { fallbackV6.text = text; }
                    await sock.sendMessage(m.chat, fallbackV6, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 7:
                try {
                    const { prepareWAMessageMedia } = require('ourin');
                    const prefixV7 = botConfig.command?.prefix || '.';
                    const categoriesV7 = getCategories();
                    const commandsByCategoryV7 = getCommandsByCategory();
                    const categoryOrderV7 = ['main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info'];
                    
                    const modeAllowedMapV7 = {
                        md: null,
                        cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                        store: ['main', 'group', 'sticker', 'owner', 'store'],
                        pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                    };
                    const modeExcludeMapV7 = {
                        md: ['panel', 'pushkontak', 'store'],
                        cpanel: null, store: null, pushkontak: null
                    };
                    
                    const allowedCatsV7 = modeAllowedMapV7[botMode];
                    const excludeCatsV7 = modeExcludeMapV7[botMode] || [];
                    
                    const sortedCatsV7 = categoriesV7.sort((a, b) => {
                        const indexA = categoryOrderV7.indexOf(a);
                        const indexB = categoryOrderV7.indexOf(b);
                        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                    });
                    
                    const carouselCards = [];
                    
                    for (const cat of sortedCatsV7) {
                        if (cat === 'owner' && !m.isOwner) continue;
                        if (allowedCatsV7 && !allowedCatsV7.includes(cat.toLowerCase())) continue;
                        if (excludeCatsV7 && excludeCatsV7.includes(cat.toLowerCase())) continue;
                        
                        const cmds = commandsByCategoryV7[cat] || [];
                        if (cmds.length === 0) continue;
                        
                        const emoji = CATEGORY_EMOJIS[cat] || '📁';
                        const categoryName = toSmallCaps(cat);
                        
                        let cardBody = `━━━━━━━━━━━━━━━\n`;
                        
                        for (const cmd of cmds.slice(0, 15)) {
                            cardBody += `◦ \`${prefixV7}${toSmallCaps(cmd)}\`\n`;
                        }
                        if (cmds.length > 15) {
                            cardBody += `\n_...dan ${cmds.length - 15} command lainnya_`;
                        }
                        
                        cardBody += `\n\n> Total: ${cmds.length} commands`;
                        
                        let cardMedia = null;
                        try {
                            const catThumbPath = path.join(process.cwd(), 'assets', 'images', `cat-${cat}.jpg`);
                            const defaultV7Path = path.join(process.cwd(), 'assets', 'images', 'ourin-v7.jpg');
                            let sourceImage = fs.existsSync(defaultV7Path) ? fs.readFileSync(defaultV7Path) : thumbBuffer;
                            
                            if (fs.existsSync(catThumbPath)) {
                                sourceImage = fs.readFileSync(catThumbPath);
                            }
                            
                            if (sourceImage) {
                                const resizedImage = await sharp(sourceImage)
                                    .resize(300, 300, { fit: 'cover' })
                                    .jpeg({ quality: 80 })
                                    .toBuffer();
                                
                                cardMedia = await prepareWAMessageMedia({
                                    image: resizedImage
                                }, {
                                    upload: sock.waUploadToServer
                                });
                            }
                        } catch (e) {
                            console.error('[Menu V7] Card media error:', e.message);
                        }
                        
                        const cardMessage = {
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                title: `${emoji} ${categoryName.toUpperCase()}`,
                                hasMediaAttachment: !!cardMedia,
                                ...(cardMedia || {})
                            }),
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: cardBody
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.create({
                                text: `${botConfig.bot?.name || 'Ourin'} • ${cat}`
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                buttons: [{
                                    name: 'quick_reply',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: `📋 Lihat ${categoryName}`,
                                        id: `${prefixV7}menucat ${cat}`
                                    })
                                }]
                            })
                        };
                        
                        carouselCards.push(cardMessage);
                    }
                    
                    if (carouselCards.length === 0) {
                        await m.reply(text);
                        break;
                    }
                    
                    const msg = await generateWAMessageFromContent(m.chat, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                                    body: proto.Message.InteractiveMessage.Body.fromObject({
                                        text: `${getTimeGreeting()} *${m.pushName}!*\n\n> Geser untuk melihat kategori menu\n> Ketuk tombol untuk melihat detail`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                        text: `${botConfig.bot?.name || 'Ourin'} v${botConfig.bot?.version || '1.0'}`
                                    }),
                                    carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                        cards: carouselCards
                                    })
                                })
                            }
                        }
                    }, {
                        userJid: m.sender,
                        quoted: getVerifiedQuoted(botConfig)
                    });
                    
                    await sock.relayMessage(m.chat, msg.message, {
                        messageId: msg.key.id
                    });
                    
                } catch (carouselError) {
                    console.error('[Menu V7] Carousel error:', carouselError.message);
                    const fallbackV7 = { contextInfo: getContextInfo(botConfig, m, thumbBuffer) };
                    if (imageBuffer) { fallbackV7.image = imageBuffer; fallbackV7.caption = text; }
                    else { fallbackV7.text = text; }
                    await sock.sendMessage(m.chat, fallbackV7, { quoted: getVerifiedQuoted(botConfig) });
                }
                break;
                
            case 8:
                const timeHelperV8 = require('../../src/lib/timeHelper');
                const timeV8 = timeHelperV8.formatTime('HH:mm');
                const dateV8 = timeHelperV8.formatFull('DD/MM/YYYY');
                const userV8 = db.getUser(m.sender);
                const greetingV8 = getTimeGreeting();
                const uptimeV8 = formatUptime(uptime);
                
                const categoriesV8 = getCategories();
                const cmdsByCatV8 = getCommandsByCategory();
                let totalCmdV8 = 0;
                for (const cat of categoriesV8) {
                    totalCmdV8 += (cmdsByCatV8[cat] || []).length;
                }
                
                let roleV8 = '𝙐𝙨𝙚𝙧', emojiV8 = '◈';
                if (m.isOwner) { roleV8 = '𝙊𝙬𝙣𝙚𝙧'; emojiV8 = '♚'; }
                else if (m.isPremium) { roleV8 = '𝙋𝙧𝙚𝙢𝙞𝙪𝙢'; emojiV8 = '✦'; }
                
                const prefixV8 = botConfig.command?.prefix || '.';
                const catOrderV8 = ['main', 'ai', 'download', 'search', 'tools', 'fun', 'game', 'sticker', 'canvas', 'group', 'media', 'user', 'rpg', 'owner'];
                const sortedCatsV8 = [...categoriesV8].sort((a, b) => {
                    const iA = catOrderV8.indexOf(a.toLowerCase());
                    const iB = catOrderV8.indexOf(b.toLowerCase());
                    return (iA === -1 ? 999 : iA) - (iB === -1 ? 999 : iB);
                });
                
                const modeAllowV8 = {
                    md: null,
                    cpanel: ['main', 'group', 'sticker', 'owner', 'tools', 'panel'],
                    store: ['main', 'group', 'sticker', 'owner', 'store'],
                    pushkontak: ['main', 'group', 'sticker', 'owner', 'pushkontak']
                };
                const modeExcludeV8 = {
                    md: ['panel', 'pushkontak', 'store'],
                    cpanel: null, store: null, pushkontak: null
                };
                const allowV8 = modeAllowV8[botMode];
                const excludeV8 = modeExcludeV8[botMode] || [];
                
                let menuV8 = ``;
                
                const sparkles = ['✦', '✧', '⋆', '˚', '✵', '⊹'];
                const randomSparkle = () => sparkles[Math.floor(Math.random() * sparkles.length)];
                
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n`;
                menuV8 += `*${botConfig.bot?.name || '𝗢𝗨𝗥𝗜𝗡-𝗔𝗜'}*\n`;
                menuV8 += `${randomSparkle()}━━━━━━━━━━━━━━━━━━━━━${randomSparkle()}\n\n`;
                
                menuV8 += `┏━━━〔 ${emojiV8} *𝗣𝗥𝗢𝗙𝗜𝗟𝗘* 〕━━━┓\n`;
                menuV8 += `┃ 👤 *${m.pushName}*\n`;
                menuV8 += `┃ 🏷️ ${roleV8}\n`;
                menuV8 += `┃ ⏰ ${timeV8} WIB\n`;
                menuV8 += `┃ 📅 ${dateV8}\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━┛\n\n`;
                
                menuV8 += `┏━━〔 ⚡ *𝗦𝗬𝗦𝗧𝗘𝗠 𝗦𝗧𝗔𝗧𝗦* 〕━━┓\n`;
                menuV8 += `┃ 🎫 Limit   ➤ ${m.isOwner || m.isPremium ? '∞ Unlimited' : `${userV8?.limit ?? 25}/25`}\n`;
                menuV8 += `┃ ⏱️ Uptime  ➤ ${uptimeV8}\n`;
                menuV8 += `┃ 🔧 Mode    ➤ ${botMode.toUpperCase()}\n`;
                menuV8 += `┃ 📊 Total   ➤ ${totalCmdV8} Commands\n`;
                menuV8 += `┃ 👥 Users   ➤ ${db.getUserCount()} Aktif\n`;
                menuV8 += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
                
                menuV8 += `╭══════════════════════╮\n`;
                menuV8 += `║  📋 *𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗟𝗜𝗦𝗧*    ║\n`;
                menuV8 += `╰══════════════════════╯\n\n`;
                
                for (const cat of sortedCatsV8) {
                    if (cat === 'owner' && !m.isOwner) continue;
                    if (allowV8 && !allowV8.includes(cat.toLowerCase())) continue;
                    if (excludeV8.includes(cat.toLowerCase())) continue;
                    
                    const cmdsV8 = cmdsByCatV8[cat] || [];
                    if (cmdsV8.length === 0) continue;
                    
                    const emojiCat = CATEGORY_EMOJIS[cat] || '▣';
                    menuV8 += `┌─────「 ${emojiCat} *${cat.toUpperCase()}* 」\n`;
                    menuV8 += `│ ✦ Total: ${cmdsV8.length} commands\n`;
                    menuV8 += `│\n`;
                    
                    for (const cmd of cmdsV8) {
                        menuV8 += `│ ├➤ ${prefixV8}${cmd}\n`;
                    }
                    menuV8 += `│\n`;
                    menuV8 += `└───────────────────\n\n`;
                }
                
                menuV8 += `╭━━〔 💡 *𝗧𝗜𝗣𝗦* 〕━━╮\n`;
                menuV8 += `│ ❸ Follow channel ${config.saluran?.link || 'Ourin-AI'}\n`;
                menuV8 += `╰━━━━━━━━━━━━━━━━━━╯\n\n`;
                
                menuV8 += `> ${randomSparkle()} *${botConfig.bot?.name}* v${botConfig.bot?.version || '1.7.1'} ${randomSparkle()}`;
                
                
                let thumbV8 = thumbBuffer;
                if (thumbBuffer) {
                    try {
                        thumbV8 = await sharp(thumbBuffer)
                            .resize(300, 300, { fit: 'cover' })
                            .jpeg({ quality: 80 })
                            .toBuffer();
                    } catch (e) {
                        thumbV8 = thumbBuffer;
                    }
                }
                
                const ftroliQuoted = {
                    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                    message: {
                        orderMessage: {
                            orderId: '1337',
                            thumbnail: thumbV8 || null,
                            itemCount: totalCmdV8,
                            status: 'INQUIRY',
                            surface: 'CATALOG',
                            message: `${botConfig.bot?.name || 'Ourin-AI'} Menu`,
                            orderTitle: `📋 ${totalCmdV8} Commands`,
                            sellerJid: botConfig.botNumber ? `${botConfig.botNumber}@s.whatsapp.net` : m.sender,
                            token: 'ourin-menu-v8',
                            totalAmount1000: 0,
                            totalCurrencyCode: 'IDR',
                            contextInfo: {
                                isForwarded: true,
                                forwardingScore: 9999,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: botConfig.saluran?.id || '120363208449943317@newsletter',
                                    newsletterName: botConfig.saluran?.name || botConfig.bot?.name || 'Ourin-AI',
                                    serverMessageId: 127
                                }
                            }
                        }
                    }
                };
                
                await sock.sendMessage(m.chat, {
                    image: fs.readFileSync('assets/images/ourin-v8.jpg'),
                    caption: menuV8,
                    contextInfo: getContextInfo(botConfig, m, imageBuffer, true)
                }, { quoted: ftroliQuoted });
                break;
                
            default:
                await m.reply(text);
        }
        const audioPath = path.join(process.cwd(), 'assets', 'audio', 'ourin.mp3');
        if (fs.existsSync(audioPath)) {
            const { execSync } = require('child_process');
            const tempOpus = path.join(process.cwd(), 'assets', 'audio', 'temp_vn.opus');
            try {
                execSync(`ffmpeg -y -i "${audioPath}" -c:a libopus -b:a 64k "${tempOpus}"`, { stdio: 'ignore' });
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(tempOpus),
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                }, { quoted: getVerifiedQuoted(botConfig) });
                
                if (fs.existsSync(tempOpus)) fs.unlinkSync(tempOpus);
            } catch (ffmpegErr) {
                await sock.sendMessage(m.chat, {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mpeg',
                    ptt: true,
                    contextInfo: getContextInfo(botConfig, m, thumbBuffer)
                }, { quoted: getVerifiedQuoted(botConfig) });
            }
        }
    } catch (error) {
        console.error('[Menu] Error on command execution:', error.message);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
