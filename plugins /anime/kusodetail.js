const { kusonime } = require('../../src/scraper/kusonime')

const pluginConfig = {
    name: 'kusodetail',
    alias: ['animedetail', 'kusodl'],
    category: 'anime',
    description: 'Detail dan download anime dari Kusonime',
    usage: '.kusodetail <url>',
    example: '.kusodetail https://kusonime.com/naruto/',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.args[0]
    
    if (!url || !url.includes('kusonime.com')) {
        return m.reply(
            `🎬 *ᴋᴜsᴏɴɪᴍᴇ ᴅᴇᴛᴀɪʟ*\n\n` +
            `> Masukkan URL dari kusonime.com\n\n` +
            `\`Contoh: ${m.prefix}kusodetail https://kusonime.com/...\``
        )
    }
    
    m.react('🔍')
    
    try {
        const result = await kusonime.detail(url)
        
        if (!result?.metadata) {
            m.react('❌')
            return m.reply(`❌ Gagal mendapatkan detail anime`)
        }
        
        const meta = result.metadata
        const info = meta.info || {}
        
        let response = `🎬 *${meta.title || 'Unknown'}*\n\n`
        
        if (info.japanese) response += `> 🇯🇵 ${info.japanese}\n`
        if (info.seasons) response += `> 📺 Season: ${info.seasons || info.season}\n`
        if (info.type) response += `> 📁 Type: ${info.type}\n`
        if (info.status) response += `> 📊 Status: ${info.status}\n`
        if (info.total_episode) response += `> 🎞️ Episode: ${info.total_episode}\n`
        if (info.score) response += `> ⭐ Score: ${info.score}\n`
        if (info.duration) response += `> ⏱️ Duration: ${info.duration}\n`
        if (info.genres?.length) response += `> 🏷️ Genre: ${info.genres.join(', ')}\n`
        if (info.producers) response += `> 🏢 Producers: ${info.producers}\n`
        
        if (meta.sinopsis) {
            response += `\n📝 *ꜱɪɴᴏᴘꜱɪꜱ:*\n${meta.sinopsis.substring(0, 500)}${meta.sinopsis.length > 500 ? '...' : ''}\n`
        }
        
        if (result.download?.length > 0) {
            response += `\n📥 *ᴅᴏᴡɴʟᴏᴀᴅ:*\n`
            result.download.slice(0, 3).forEach(batch => {
                response += `\n*${batch.title}*\n`
                Object.keys(batch.resolutions).forEach(res => {
                    const links = batch.resolutions[res].slice(0, 3)
                    response += `├ ${res}: ${links.map(l => l.provider).join(', ')}\n`
                })
            })
        }
        
        m.react('✅')
        
        if (meta.poster_url) {
            await sock.sendMessage(m.chat, {
                image: { url: meta.poster_url },
                caption: response
            }, { quoted: m })
        } else {
            await m.reply(response)
        }
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
