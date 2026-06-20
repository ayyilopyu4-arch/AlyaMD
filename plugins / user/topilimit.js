const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'toplimit',
    alias: ['leaderboardlimit', 'lblimit'],
    category: 'user',
    description: 'Leaderboard limit',
    usage: '.toplimit',
    example: '.toplimit',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

async function handler(m, { sock }) {
    const db = getDatabase()
    
    const ownerNumbers = (config.owner?.number || []).map(n => n.replace(/[^0-9]/g, ''))
    
    const allUsers = Object.values(db.getAllUsers())
    const topUsers = allUsers
        .filter(u => {
            const userNum = (u.jid || u.number || '').replace(/[^0-9]/g, '')
            const isOwner = ownerNumbers.includes(userNum)
            if (isOwner) return false
            if (u.limit === -1) return false
            if ((u.limit || 0) === 0) return false
            return true
        })
        .sort((a, b) => (b.limit || 0) - (a.limit || 0))
        .slice(0, 10)
    
    if (topUsers.length === 0) {
        return m.reply(`📊 *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ ʟɪᴍɪᴛ*\n\n> Belum ada data`)
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    let text = `╭━━━━━━━━━━━━━━━━━╮\n`
    text += `┃  🏆 *ᴛᴏᴘ ʟɪᴍɪᴛ*\n`
    text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    const mentions = []
    
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i]
        const medal = MEDALS[i]
        const name = user.name || user.jid
        const limit = formatNumber(user.limit)
        
        text += `${medal} *${name}*\n`
        text += `    📊 ${limit}\n\n`
        
        mentions.push(`${user.jid}@s.whatsapp.net`)
    }
    
    text += `> 📊 Total: ${topUsers.length} users`
    
    await sock.sendMessage(m.chat, {
        text,
        mentions,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
      }

