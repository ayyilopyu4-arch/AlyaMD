const axios = require('axios')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat', 'iphonechat'],
    category: 'canvas',
    description: 'Membuat gambar chat iPhone style',
    usage: '.iqc <text>',
    example: '.iqc Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${m.prefix}iqc Hai cantik\``)
    }
    
    m.react('📱')
    
    try {
        const now = new Date()
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        const chatTime = `${now.getHours().toString().padStart(2, '0')}:${(now.getMinutes() - 5).toString().padStart(2, '0')}`
        
        const res = await axios.get(`https://api.neoxr.eu/api/iqc?text=${encodeURIComponent(text)}&time=${encodeURIComponent(time)}&chat_time=${encodeURIComponent(chatTime)}&apikey=${NEOXR_APIKEY}`, { 
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data?.url) {
            throw new Error('API tidak mengembalikan data yang valid')
        }
        
        const imageUrl = res.data.data.url
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> \`${text}\``
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
