const axios = require('axios')

const pluginConfig = {
    name: 'gemini3',
    alias: ['gemini', 'geminiflash'],
    category: 'ai',
    description: 'Chat dengan Gemini 3 Flash',
    usage: '.gemini3 <pertanyaan>',
    example: '.gemini3 Hai apa kabar?',
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
        return m.reply(`✨ *ɢᴇᴍɪɴɪ 3*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gemini3 Hai apa kabar?\``)
    }
    
    m.react('✨')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/gemini/3-flash?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        m.react('✅')
        await m.reply(`✨ *ɢᴇᴍɪɴɪ 3*\n\n${data.result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
