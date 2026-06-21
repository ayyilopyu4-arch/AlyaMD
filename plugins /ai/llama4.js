const axios = require('axios')

const pluginConfig = {
    name: 'llama4',
    alias: ['llama', 'llama4scout'],
    category: 'ai',
    description: 'Chat dengan LLaMA 4 Scout',
    usage: '.llama4 <pertanyaan>',
    example: '.llama4 Hai apa kabar?',
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
        return m.reply(`🦙 *ʟʟᴀᴍᴀ 4*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}llama4 Hai apa kabar?\``)
    }
    
    m.react('🦙')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/cf/llama-4-scout-17b?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        m.react('✅')
        await m.reply(`🦙 *ʟʟᴀᴍᴀ 4*\n\n${data.result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
