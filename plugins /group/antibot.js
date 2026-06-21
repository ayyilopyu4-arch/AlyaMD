const { getDatabase } = require('../../src/lib/database')
const { findParticipantByNumber, getParticipantJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: ['antibot', 'botdetect'],
    alias: [],
    category: 'group',
    description: 'Deteksi dan kick bot WhatsApp (baileys) dari grup',
    usage: '.antibot <on/off>',
    example: '.antibot on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    
    const groupData = db.getGroup(m.chat) || {}
    const current = groupData.antibot || false
    
    if (!args || args === 'status') {
        return m.reply(
            `🤖 *ᴀɴᴛɪ-ʙᴏᴛ*\n\n` +
            `> Status: ${current ? '✅ Aktif' : '❌ Nonaktif'}\n\n` +
            `*Penggunaan:*\n` +
            `> \`${m.prefix}antibot on\` - Aktifkan\n` +
            `> \`${m.prefix}antibot off\` - Nonaktifkan\n\n` +
            `_Deteksi bot berdasarkan message ID (baileys pattern)_`
        )
    }
    
    if (args === 'on') {
        db.setGroup(m.chat, { ...groupData, antibot: true })
        db.save()
        m.react('✅')
        return m.reply(
            `✅ *ᴀɴᴛɪ-ʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
            `> Bot WA lain akan terdeteksi dan di-kick otomatis.`
        )
    }
    
    if (args === 'off') {
        db.setGroup(m.chat, { ...groupData, antibot: false })
        db.save()
        m.react('❌')
        return m.reply(`❌ *ᴀɴᴛɪ-ʙᴏᴛ ɴᴏɴᴀᴋᴛɪꜰ*`)
    }
    
    return m.reply(`❌ *ᴀʀɢᴜᴍᴇɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Gunakan: \`on\` atau \`off\``)
}

function isBotMessage(m) {
    const messageId = m.key?.id || m.id || ''
    
    if (messageId.startsWith('3EB0')) {
        return { isBot: true, reason: 'baileys-3EB0' }
    }
    
    if (messageId.startsWith('BAE5') && messageId.length === 16) {
        return { isBot: true, reason: 'baileys-BAE5' }
    }
    
    if (m.isBaileys) {
        return { isBot: true, reason: 'isBaileys-flag' }
    }
    
    const msg = m.message || {}
    
    if (msg.deviceSentMessage) {
        return { isBot: true, reason: 'deviceSentMessage' }
    }
    
    if (msg.buttonsMessage || msg.templateMessage || msg.listMessage || 
        msg.buttonsResponseMessage || msg.listResponseMessage) {
        return { isBot: true, reason: 'interactiveMessage' }
    }
    
    return { isBot: false, reason: null }
}

async function detectBot(m, sock) {
    if (!m.isGroup) return false
    
    const db = getDatabase()
    const groupData = db.getGroup(m.chat)
    
    if (!groupData?.antibot) {
        return false
    }
    
    const result = isBotMessage(m)
    
    const msgId = m.key?.id || m.id || ''
    if (!result.isBot) return false
    
    const botJid = m.sender
    if (!botJid) {
        return false
    }
    
    const groupMeta = await sock.groupMetadata(m.chat).catch((e) => {
        return null
    })
    if (!groupMeta) return false
    
    const myNumber = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0]
    const myJid = myNumber + '@s.whatsapp.net'
    
    const botParticipant = findParticipantByNumber(groupMeta.participants, myJid)
    
    if (!botParticipant?.admin) {
        return false
    }
    
    const targetParticipant = findParticipantByNumber(groupMeta.participants, botJid)
    
    if (targetParticipant?.admin) {
        return false
    }
    
    const targetJidToKick = targetParticipant ? getParticipantJid(targetParticipant) : botJid
    
    try {
        await sock.sendMessage(m.chat, { delete: m.key })
        await sock.groupParticipantsUpdate(m.chat, [targetJidToKick], 'remove')
        
        await sock.sendMessage(m.chat, {
            text: `🤖 *ʙᴏᴛ ᴛᴇʀᴅᴇᴛᴇᴋsɪ!*\n\n` +
                  `> User @${botJid.split('@')[0]} terdeteksi sebagai bot.\n` +
                  `> Alasan: *${result.reason}*\n` +
                  `> Tindakan: *KICK*`,
            mentions: [botJid]
        })
        
        return true
    } catch (err) {
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    detectBot,
    isBotMessage
}
