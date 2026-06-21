const axios = require('axios')

const pluginConfig = {
    name: 'sandtext',
    alias: ['sand', 'beachtext', 'pasir'],
    category: 'canvas',
    description: 'Generate teks di pasir pantai',
    usage: '.sandtext <text>',
    example: '.sandtext Hello',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(`🏖️ *sᴀɴᴅ ᴛᴇxᴛ*\n\n> Masukkan teks\n\n\`Contoh: ${m.prefix}sandtext Hello\``)
    }
    
    if (text.length > 20) {
        return m.reply(`❌ Teks maksimal 20 karakter!`)
    }
    
    m.react('🏖️')
    
    try {
        const url = `https://api.nekolabs.web.id/canvas/ephoto/beach-sand-text/v2?text=${encodeURIComponent(text)}`
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🏖️ *sᴀɴᴅ ᴛᴇxᴛ*`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
