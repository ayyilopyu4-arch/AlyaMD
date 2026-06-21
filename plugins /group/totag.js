const config = require('../../config')

const pluginConfig = {
    name: 'totag',
    alias: ['tagall2', 'mentionall'],
    category: 'group',
    description: 'Tag semua member dengan reply pesan',
    usage: '.totag (reply pesan)',
    example: '.totag',
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
    if (!m.quoted) {
        return m.reply(
            `📢 *ᴛᴏᴛᴀɢ*\n\n` +
            `> Reply pesan yang ingin di-forward ke semua member\n\n` +
            `> Contoh: Reply pesan lalu ketik \`${m.prefix}totag\``
        )
    }
    
    m.react('📢')
    
    try {
        const users = participants.map(u => u.id).filter(v => v !== sock.user?.jid && v !== sock.user?.id)
        
        await sock.sendMessage(m.chat, {
            forward: m.quoted.fakeObj,
            mentions: users
        })
        
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
