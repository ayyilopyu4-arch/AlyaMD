const { kusonime } = require('../../src/scraper/kusonime')

const pluginConfig = {
    name: 'kusonime',
    alias: ['kuso', 'anime'],
    category: 'anime',
    description: 'Cari anime di Kusonime',
    usage: '.kusonime <judul>',
    example: '.kusonime naruto',
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
        return m.reply(
            `🎬 *ᴋᴜsᴏɴɪᴍᴇ*\n\n` +
            `> Cari anime untuk download\n\n` +
            `\`Contoh: ${m.prefix}kusonime naruto\``
        )
    }
    
    m.react('🔍')
    
    try {
        const results = await kusonime.search(query)
        
        if (!results || results.length === 0) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan anime: ${query}`)
        }
        
        let response = `🎬 *ᴋᴜsᴏɴɪᴍᴇ sᴇᴀʀᴄʜ*\n\n`
        response += `> Query: *${query}*\n`
        response += `> Hasil: *${results.length} anime*\n\n`
        
        results.slice(0, 10).forEach((anime, i) => {
            response += `*${i+1}. ${anime.title}*\n`
            response += `├ 📅 ${anime.released || '-'}\n`
            response += `├ 🏷️ ${anime.genre?.join(', ') || '-'}\n`
            response += `└ 🔗 ${anime.url}\n\n`
        })
        
        response += `> _Gunakan \`${m.prefix}kusodetail <url>\` untuk detail_`
        
        m.react('✅')
        
        if (results[0]?.thumb) {
            await sock.sendMessage(m.chat, {
                image: { url: results[0].thumb },
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
