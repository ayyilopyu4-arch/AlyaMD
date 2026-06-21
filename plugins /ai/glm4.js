const axios = require('axios')

const pluginConfig = {
    name: 'glm4',
    alias: ['glm', 'glm46v'],
    category: 'ai',
    description: 'Chat dengan GLM 4.6V',
    usage: '.glm4 <pertanyaan>',
    example: '.glm4 Hai apa kabar?',
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
        return m.reply(`🌐 *ɢʟᴍ 4.6ᴠ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}glm4 Hai apa kabar?\``)
    }
    
    m.react('🌐')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/glm/4.6v?text=${encodeURIComponent(text)}&search=false&reasoning=false`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        const content = data.result?.content || data.result
        
        m.react('✅')
        await m.reply(`🌐 *ɢʟᴍ 4.6ᴠ*\n\n${content}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
