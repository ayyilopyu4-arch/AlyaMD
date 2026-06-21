const axios = require('axios')

const pluginConfig = {
    name: 'otakudesu',
    alias: ['otaku', 'otak'],
    category: 'anime',
    description: 'Cari anime di Otakudesu',
    usage: '.otakudesu <query>',
    example: '.otakudesu Oshi no ko',
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
            `> \`${m.prefix}otakudesu <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}otakudesu Oshi no ko\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/otakudesu/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan anime untuk: ${query}`)
        }
        
        const animes = res.data.result.slice(0, 5)
        
        let txt = `🎌 *ᴏᴛᴀᴋᴜᴅᴇsᴜ sᴇᴀʀᴄʜ*\n\n`
        txt += `╭┈┈⬡「 🔍 *ɪɴꜰᴏ* 」\n`
        txt += `┃ 🔎 ǫᴜᴇʀʏ: *${query}*\n`
        txt += `╰┈┈⬡\n\n`
        
        animes.forEach((a, i) => {
            const statusIcon = a.status === 'Completed' ? '🔵' : a.status === 'Ongoing' ? '🟢' : '⚪'
            txt += `「 📺 *${i + 1}* 」\n`
            txt += `\`\`\`${a.title}\`\`\`\n`
            txt += `📊 sᴛᴀᴛᴜs: *${statusIcon} ${a.status || '-'}*\n`
            txt += `🏷️ ɢᴇɴʀᴇ: *${a.genres?.join(', ') || '-'}*\n`
            txt += `⭐ ʀᴀᴛɪɴɢ: *${a.rating || '-'}*\n`
            txt += `🔗 \`${a.url}\`\n`
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
