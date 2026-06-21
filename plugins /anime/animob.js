const axios = require('axios')

const pluginConfig = {
    name: 'animob',
    alias: ['aniwatch', 'zoro'],
    category: 'anime',
    description: 'Cari anime di Animob/Aniwatch',
    usage: '.animob <query>',
    example: '.animob Oshi no ko',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}animob <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}animob Oshi no ko\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/animob/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.data?.length) {
            return m.reply(`❌ Tidak ditemukan anime untuk: ${query}`)
        }
        
        const animes = res.data.result.data.slice(0, 5)
        
        let txt = `🎌 *ᴀɴɪᴍᴏʙ sᴇᴀʀᴄʜ*\n\n`
        txt += `╭┈┈⬡「 🔍 *ɪɴꜰᴏ* 」\n`
        txt += `┃ 🔎 ǫᴜᴇʀʏ: *${query}*\n`
        txt += `╰┈┈⬡\n\n`
        
        animes.forEach((a, i) => {
            const tv = a.tvInfo || {}
            const adult = a.adultContent ? ' 🔞' : ''
            txt += `「 📺 *${i + 1}* 」${adult}\n`
            txt += `\`\`\`${a.title}\`\`\`\n`
            txt += `🇯🇵 \`${a.japanese_title || '-'}\`\n`
            txt += `🎬 ᴛʏᴘᴇ: *${tv.showType || '-'}* • ⏱️ *${tv.duration || '-'}*\n`
            txt += `📺 sᴜʙ: *${tv.sub || 0}* • ᴅᴜʙ: *${tv.dub || 0}* • ᴇᴘs: *${tv.eps || '-'}*\n`
            txt += `🔗 \`https://aniwatch.to/${a.id}\`\n`
            txt += `\n`
        })
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
