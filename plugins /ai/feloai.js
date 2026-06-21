const axios = require('axios')

const pluginConfig = {
    name: 'feloai',
    alias: ['felo'],
    category: 'ai',
    description: 'Chat dengan Felo AI',
    usage: '.feloai <pertanyaan>',
    example: '.feloai Hai apa kabar?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`🤖 *ꜰᴇʟᴏ ᴀɪ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}feloai Hai apa kabar?\``)
    }
    
    m.react('🤖')
    
    try {
        const url = `https://api.nekolabs.web.id/text.gen/feloai?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        const chat = data.result?.text || data.result
        
        m.react('✅')
        await m.reply(`🤖 *ꜰᴇʟᴏ ᴀɪ*\n\n${chat}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
