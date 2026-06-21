const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'jodoh',
    alias: ['match', 'shipcouple', 'ship'],
    category: 'fun',
    description: 'Jodohkan 2 member random dengan kecocokan',
    usage: '.jodoh',
    example: '.jodoh',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

let thumbFun = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbFun = fs.readFileSync(thumbPath)
} catch (e) {}

const loveQuotes = [
    'Cinta sejati tidak pernah mengenal jarak 💕',
    'Dua hati yang bersatu takkan terpisahkan 💗',
    'Kalian seperti puzzle yang sempurna 🧩',
    'Match made in heaven! ✨',
    'Chemistry-nya kuat banget! 🔥',
    'Couple goals banget sih kalian 💑',
    'Destiny brought you together 🌟',
    'Perfect match detected! 💘'
]

const compatibilityEmoji = (percent) => {
    if (percent >= 90) return '💕💕💕💕💕'
    if (percent >= 70) return '💕💕💕💕'
    if (percent >= 50) return '💕💕💕'
    if (percent >= 30) return '💕💕'
    return '💕'
}

const compatibilityText = (percent) => {
    if (percent >= 90) return 'JODOH SEJATI! 💍'
    if (percent >= 70) return 'Sangat Cocok! 💖'
    if (percent >= 50) return 'Lumayan Cocok 💗'
    if (percent >= 30) return 'Bisa Dicoba 💓'
    return 'Butuh Usaha Lebih 💔'
}

function getContextInfo(title = '💘 *ᴊᴏᴅᴏʜ*', body = 'Random Match!') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbFun) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbFun,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    
    let groupMeta
    try {
        groupMeta = await sock.groupMetadata(m.chat)
    } catch (e) {
        return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa mengambil data grup!')
    }
    
    const participants = groupMeta.participants || []
    const eligibleMembers = participants
        .map(p => p.jid || p.id)
        .filter(jid => jid && jid !== botNumber)
    
    if (eligibleMembers.length < 2) {
        return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Minimal ada 2 member untuk dijodohkan!')
    }
    
    const shuffled = eligibleMembers.sort(() => Math.random() - 0.5)
    const person1 = shuffled[0]
    const person2 = shuffled[1]
    
    const compatibility = Math.floor(Math.random() * 100) + 1
    const quote = loveQuotes[Math.floor(Math.random() * loveQuotes.length)]
    
    const labels = Math.random() > 0.5 ? ['👨', '👩'] : ['👩', '👨']
    
    const progressBar = (() => {
        const filled = Math.floor(compatibility / 10)
        const empty = 10 - filled
        return '█'.repeat(filled) + '░'.repeat(empty)
    })()
    
    let text = `💘 *ᴊᴏᴅᴏʜ ʀᴀɴᴅᴏᴍ*\n\n`
    text += `╭┈┈⬡「 💑 *ᴘᴀsᴀɴɢᴀɴ* 」\n`
    text += `┃ ${labels[0]} @${person1.split('@')[0]}\n`
    text += `┃ ❤️\n`
    text += `┃ ${labels[1]} @${person2.split('@')[0]}\n`
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    text += `╭┈┈⬡「 📊 *ᴋᴇᴄᴏᴄᴏᴋᴀɴ* 」\n`
    text += `┃ ${progressBar} *${compatibility}%*\n`
    text += `┃ ${compatibilityEmoji(compatibility)}\n`
    text += `┃ Status: *${compatibilityText(compatibility)}*\n`
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    text += `> _"${quote}"_`
    
    await m.react('💘')
    const ctx = getContextInfo('💘 JODOH', `${compatibility}% Match!`)
    ctx.mentionedJid = [person1, person2]
    
    await sock.sendMessage(m.chat, {
        text,
        mentions: [person1, person2],
        contextInfo: ctx
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
