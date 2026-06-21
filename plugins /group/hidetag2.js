const config = require('../../config')

const pluginConfig = {
    name: 'hidetag2',
    alias: ['h2', 'ht2'],
    category: 'group',
    description: 'Hidetag dengan fakeQuoted styling',
    usage: '.h2 <text> atau reply pesan',
    example: '.h2 Pengumuman penting!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock, participants }) {
    const text = m.text?.trim()
    
    if (!text && !m.quoted) {
        return m.reply(
            `📢 *ʜɪᴅᴇᴛᴀɢ 2*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ \`${m.prefix}h2 <text>\` - Kirim text\n` +
            `┃ ◦ Reply pesan + \`${m.prefix}h2\` - Forward pesan\n` +
            `╰┈┈⬡`
        )
    }
    
    m.react('📢')
    
    try {
        const users = participants.map(a => a.id)
        
        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: "13135550002@s.whatsapp.net",
                remoteJid: "13135550002@s.whatsapp.net",
                id: "FAKE_QUOTE_ID"
            },
            message: {
                conversation: config.bot?.name || 'Ourin MD'
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
            quoted: {
                key: {
                    fromMe: false,
                    participant: "13135550002@lid",
                    remoteJid: "13135550002@s.whatsapp.net",
                    id: "A523103CBB0D935ED3F9BF227AB9A94F"
                },
                message: {
                    conversation: config.bot?.name || 'Ourin MD'
                }
            }
        }
        
        if (m.quoted) {
            await sock.sendMessage(m.chat, {
                forward: m.quoted.fakeObj,
                mentions: users
            })
        } else {
            await sock.sendMessage(m.chat, {
                text: text,
                mentions: users
            }, { quoted: fakeQuoted })
        }
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
