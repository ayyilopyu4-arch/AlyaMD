const axios = require('axios')

const pluginConfig = {
    name: 'gpt41',
    alias: ['gpt4.1'],
    category: 'ai',
    description: 'Chat dengan GPT-4.1',
    usage: '.gpt41 <pertanyaan>',
    example: '.gpt41 Hai apa kabar?',
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
        return m.reply(`🧠 *ɢᴘᴛ-4.1*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gpt41 Hai apa kabar?\``)
    }
    
    m.react('🧠')
    
    try {
        const url = `https://api.nekolabs.web.id/text.gen/gpt/4.1?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        m.react('✅')
        await m.reply(`🧠 *ɢᴘᴛ-4.1*\n\n${data.result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
