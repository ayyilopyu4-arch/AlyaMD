const axios = require('axios')

const pluginConfig = {
    name: 'perplexity',
    alias: ['pplx', 'search'],
    category: 'ai',
    description: 'Cari informasi dengan Perplexity AI',
    usage: '.perplexity <query>',
    example: '.perplexity Naruto Shippuden',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.args.join(' ')
    if (!query) {
        return m.reply(`🔍 *ᴘᴇʀᴘʟᴇxɪᴛʏ*\n\n> Masukkan query pencarian\n\n\`Contoh: ${m.prefix}perplexity Naruto Shippuden\``)
    }
    
    m.react('🔍')
    
    try {
        const url = `https://api.nekolabs.web.id/txt.gen/perplexity?query=${encodeURIComponent(query)}&web=false&academic=false&social=false&finance=false`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        const result = data.result
        const answer = result.response?.answer || result.answer || ''
        const relatedQueries = result.related_queries || []
        const sources = result.response?.search_results || []
        
        let caption = `🔍 *ᴘᴇʀᴘʟᴇxɪᴛʏ*\n\n`
        caption += `📝 *ǫᴜᴇʀʏ:* \`${query}\`\n\n`
        caption += `${answer}\n`
        
        if (sources.length > 0) {
            caption += `\n🔗 *sᴏᴜʀᴄᴇs*\n`
            sources.slice(0, 5).forEach((src, i) => {
                caption += `> ${i + 1}. \`${src.name || src.url}\`\n`
            })
        }
        
        if (relatedQueries.length > 0) {
            caption += `\n💡 *ʀᴇʟᴀᴛᴇᴅ*\n`
            relatedQueries.slice(0, 5).forEach((q, i) => {
                caption += `> ${i + 1}. \`${q}\`\n`
            })
        }
        
        m.react('✅')
        await m.reply(caption)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
