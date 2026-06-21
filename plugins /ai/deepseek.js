const axios = require('axios')

const pluginConfig = {
    name: 'deepseek',
    alias: ['deepseekr1', 'dsr1'],
    category: 'ai',
    description: 'Chat dengan DeepSeek R1',
    usage: '.deepseek <pertanyaan>',
    example: '.deepseek Jelaskan tentang AI',
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
        return m.reply(`🧠 *ᴅᴇᴇᴘsᴇᴇᴋ ʀ1*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}deepseek Jelaskan tentang AI\``)
    }
    
    m.react('🧠')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/cf/deepseek-r1?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        let result = data.result
        result = result.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim()
        
        m.react('✅')
        await m.reply(`🧠 *ᴅᴇᴇᴘsᴇᴇᴋ ʀ1*\n\n${result}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
