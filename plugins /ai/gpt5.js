const axios = require('axios')

const pluginConfig = {
    name: 'gpt5',
    alias: ['gpt5nano', 'gptnano'],
    category: 'ai',
    description: 'Chat dengan GPT 5 Nano',
    usage: '.gpt5 <pertanyaan>',
    example: '.gpt5 Hai apa kabar?',
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
        return m.reply(`🚀 *ɢᴘᴛ 5 ɴᴀɴᴏ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gpt5 Hai apa kabar?\``)
    }
    
    m.react('🚀')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/gpt/5-nano?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        m.react('✅')
        await m.reply(`🚀 *ɢᴘᴛ 5 ɴᴀɴᴏ*\n\n${data.result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
