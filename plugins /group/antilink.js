const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'antilink',
    alias: ['al'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti link di grup',
    usage: '.antilink <on/off/kick/remove>',
    example: '.antilink on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

const DEFAULT_BLOCKED_LINKS = [
    'chat.whatsapp.com',
    'wa.me',
    'bit.ly',
    't.me',
    'telegram.me',
    'discord.gg',
    'discord.com/invite',
    'tinyurl.com',
    's.id'
]

function containsLink(text, customList = []) {
    if (!text || typeof text !== 'string') return { hasLink: false, link: null }
    
    const lowerText = text.toLowerCase()
    const allLinks = [...new Set([...DEFAULT_BLOCKED_LINKS, ...customList])]
    
    for (const link of allLinks) {
        if (!link) continue
        const lowerLink = link.toLowerCase().trim()
        if (lowerText.includes(lowerLink)) {
            return { hasLink: true, link: lowerLink }
        }
    }
    
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
    const matches = text.match(urlRegex)
    if (matches && matches.length > 0) {
        for (const match of matches) {
            const matchLower = match.toLowerCase()
            for (const blocked of allLinks) {
                if (matchLower.includes(blocked.toLowerCase())) {
                    return { hasLink: true, link: match }
                }
            }
        }
    }
    
    return { hasLink: false, link: null }
}

async function checkAntilink(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false
    
    const groupData = db.getGroup(m.chat) || {}
    if (groupData.antilink !== 'on') return false
    
    const body = m.body || m.text || ''
    const customList = groupData.antilinkList || []
    const { hasLink, link } = containsLink(body, customList)
    
    if (!hasLink) return false
    
    const mode = groupData.antilinkMode || 'remove'
    
    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    if (mode === 'kick') {
        try {
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            
            await sock.sendMessage(m.chat, {
                text: `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ʟɪɴᴋ: \`${link}\`
┃ ㊗ ᴀᴄᴛɪᴏɴ: *KICKED*
┃
╰┈┈⬡

> _User dikeluarkan karena mengirim link!_`,
                mentions: [m.sender],
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            })
        } catch {}
    } else {
        await sock.sendMessage(m.chat, {
            text: `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ʟɪɴᴋ: \`${link}\`
┃ ㊗ ᴀᴄᴛɪᴏɴ: Dihapus
┃
╰┈┈⬡

> _Link tidak diperbolehkan di grup ini!_`,
            mentions: [m.sender],
            contextInfo: {
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
    
    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}

    if (!action) {
        const status = group.antilink || 'off'
        const mode = group.antilinkMode || 'remove'
        const modeText = mode === 'kick' ? 'Kick User' : 'Hapus Pesan'
        const customList = group.antilinkList || []

        await m.reply(
            `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃ ㊗ sᴛᴀᴛᴜs: *${status === 'on' ? '✅ AKTIF' : '❌ NONAKTIF'}*
┃ ㊗ ᴍᴏᴅᴇ: *${modeText}*
┃ ㊗ ᴅᴇꜰᴀᴜʟᴛ: *${DEFAULT_BLOCKED_LINKS.length}* link
┃ ㊗ ᴄᴜsᴛᴏᴍ: *${customList.length}* link
╰┈┈⬡

> *Cara Penggunaan:*
> \`.antilink on\` → Aktifkan
> \`.antilink off\` → Nonaktifkan
> \`.antilink kick\` → Mode kick
> \`.antilink remove\` → Mode hapus

> \`.addantilink <link>\` → Tambah
> \`.delantilink <link>\` → Hapus
> \`.listantilink\` → Lihat daftar`
        )
        return
    }

    if (action === 'on') {
        db.setGroup(groupId, { ...group, antilink: 'on' })
        m.react('✅')
        await m.reply(
            `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *✅ AKTIF*
┃ ㊗ ᴍᴏᴅᴇ: *${(group.antilinkMode || 'remove') === 'kick' ? 'Kick' : 'Hapus'}*
┃
╰┈┈⬡

> _Semua link akan ditindak!_`
        )
        return
    }

    if (action === 'off') {
        db.setGroup(groupId, { ...group, antilink: 'off' })
        m.react('❌')
        await m.reply(
            `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *❌ NONAKTIF*
┃
╰┈┈⬡`
        )
        return
    }

    if (action === 'kick') {
        db.setGroup(groupId, { ...group, antilink: 'on', antilinkMode: 'kick' })
        m.react('⚠️')
        await m.reply(
            `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *✅ AKTIF*
┃ ㊗ ᴍᴏᴅᴇ: *⚠️ KICK*
┃
╰┈┈⬡

> _User yang kirim link akan dikeluarkan!_`
        )
        return
    }

    if (action === 'remove') {
        db.setGroup(groupId, { ...group, antilink: 'on', antilinkMode: 'remove' })
        m.react('🗑️')
        await m.reply(
            `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *✅ AKTIF*
┃ ㊗ ᴍᴏᴅᴇ: *🗑️ REMOVE*
┃
╰┈┈⬡

> _Pesan link akan dihapus otomatis!_`
        )
        return
    }

    await m.reply(`❌ Gunakan: on, off, kick, atau remove`)
}

module.exports = {
    config: pluginConfig,
    handler,
    containsLink,
    checkAntilink,
    DEFAULT_BLOCKED_LINKS
}
