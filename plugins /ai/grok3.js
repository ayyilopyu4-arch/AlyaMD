const axios = require('axios')

const pluginConfig = {
    name: 'grok3',
    alias: ['grok', 'grokjb'],
    category: 'ai',
    description: 'Chat dengan Grok 3 (Jailbreak Mode)',
    usage: '.grok3 <pertanyaan>',
    example: '.grok3 Hai apa kabar?',
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
        return m.reply(`⚡ *ɢʀᴏᴋ 3*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}grok3 Hai apa kabar?\``)
    }
    
    m.react('⚡')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/grok/3-jailbreak/v1?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        m.react('✅')
        await m.reply(`⚡ *ɢʀᴏᴋ 3*\n\n${data.result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
