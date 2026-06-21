const axios = require('axios')

const pluginConfig = {
    name: 'gemma3',
    alias: ['gamma3', 'gemma12b'],
    category: 'ai',
    description: 'Chat dengan Gemma 3 12B',
    usage: '.gemma3 <pertanyaan>',
    example: '.gemma3 Hai apa kabar?',
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
        return m.reply(`💎 *ɢᴇᴍᴍᴀ 3*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gemma3 Hai apa kabar?\``)
    }
    
    m.react('💎')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/cf/gemma-3-12b?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        m.react('✅')
        await m.reply(`💎 *ɢᴇᴍᴍᴀ 3*\n\n${data.result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
