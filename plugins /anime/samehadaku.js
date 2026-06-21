const axios = require('axios')

const pluginConfig = {
    name: 'samehadaku',
    alias: ['samehada', 'shd'],
    category: 'anime',
    description: 'Cari anime di Samehadaku',
    usage: '.samehadaku <query>',
    example: '.samehadaku Oshi no ko',
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
            `> \`${m.prefix}samehadaku <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}samehadaku Oshi no ko\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/samehadaku/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan anime untuk: ${query}`)
        }
        
        const animes = res.data.result.slice(0, 5)
        
        let txt = `🎌 *sᴀᴍᴇʜᴀᴅᴀᴋᴜ sᴇᴀʀᴄʜ*\n\n`
        txt += `╭┈┈⬡「 🔍 *ɪɴꜰᴏ* 」\n`
        txt += `┃ 🔎 ǫᴜᴇʀʏ: *${query}*\n`
        txt += `╰┈┈⬡\n\n`
        
        animes.forEach((a, i) => {
            const statusIcon = a.status === 'Completed' ? '🔵' : a.status === 'Ongoing' ? '🟢' : '⚪'
            const desc = a.description?.substring(0, 80) || '-'
            txt += `「 📺 *${i + 1}* 」\n`
            txt += `📛 \`\`\`${a.title}\`\`\`\n`
            txt += `📊 sᴛᴀᴛᴜs: *${statusIcon} ${a.status || '-'}*\n`
            txt += `🎬 ᴛʏᴘᴇ: *${a.type || '-'}* • ⭐ *${a.rating || '-'}*\n`
            txt += `🏷️ ɢᴇɴʀᴇ: *${a.genres?.slice(0, 3).join(', ') || '-'}*\n`
            txt += `📝 ${desc}${a.description?.length > 80 ? '...' : ''}\n`
            txt += `🔗 \`${a.url}\`\n\n`
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
