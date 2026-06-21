const axios = require('axios')

const pluginConfig = {
    name: 'mobinime',
    alias: ['mobi', 'animemobi'],
    category: 'anime',
    description: 'Cari anime di Mobinime',
    usage: '.mobinime <query>',
    example: '.mobinime Oshi no ko',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function getStatus(code) {
    if (code === '1' || code === 1) return '🟢 Ongoing'
    if (code === '2' || code === 2) return '🔵 Completed'
    return '⚪ Unknown'
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}mobinime <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}mobinime Oshi no ko\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/mobinime/search?q=${encodeURIComponent(query)}&count=10`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan anime untuk: ${query}`)
        }
        
        const animes = res.data.result.slice(0, 5)
        
        let txt = `🎌 *ᴍᴏʙɪɴɪᴍᴇ sᴇᴀʀᴄʜ*\n\n`
        txt += `╭┈┈⬡「 🔍 *ɪɴꜰᴏ* 」\n`
        txt += `┃ 🔎 ǫᴜᴇʀʏ: *${query}*\n`
        txt += `╰┈┈⬡\n\n`
        
        animes.forEach((a, i) => {
            txt += `「 📺 *${i + 1}* 」\n`
            txt += `\`\`\`${a.title}\`\`\`\n`
            txt += `📊 sᴛᴀᴛᴜs: *${getStatus(a.statusTayang)}*\n`
            txt += `📅 ᴛᴀʜᴜɴ: *${a.tahun || '-'}*\n`
            txt += `🎬 ᴇᴘɪsᴏᴅᴇ: *${a.episode || 0}/${a.totalEpisode || '?'}*\n`
            txt += `⭐ ʀᴀᴛɪɴɢ: *${a.rating || '-'}*\n`
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
