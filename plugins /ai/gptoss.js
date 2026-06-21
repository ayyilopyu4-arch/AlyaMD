const axios = require('axios')

const pluginConfig = {
    name: 'gptoss',
    alias: ['gptoss120b', 'gpt120b'],
    category: 'ai',
    description: 'Chat dengan GPT OSS 120B',
    usage: '.gptoss <pertanyaan>',
    example: '.gptoss Hai apa kabar?',
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
        return m.reply(`🔮 *ɢᴘᴛ ᴏss 120ʙ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gptoss Hai apa kabar?\``)
    }
    
    m.react('🔮')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/cf/gpt-oss-120b?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        const response = data.result?.response || data.result
        
        m.react('✅')
        await m.reply(`🔮 *ɢᴘᴛ ᴏss 120ʙ*\n\n${response}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
