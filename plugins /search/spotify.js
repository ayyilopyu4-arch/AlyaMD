const axios = require('axios')

const pluginConfig = {
    name: 'spotify',
    alias: ['spotifysearch', 'spsearch'],
    category: 'search',
    description: 'Cari lagu di Spotify',
    usage: '.spotify <query>',
    example: '.spotify neffex grateful',
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
            `> \`${m.prefix}spotify <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}spotify neffex grateful\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(query)}`)
        
        if (!res.data?.status || !res.data?.data?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const tracks = res.data.data.slice(0, 5)
        
        let txt = `🎵 *sᴘᴏᴛɪꜰʏ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`
        
        tracks.forEach((t, i) => {
            txt += `*${i + 1}.* ${t.title}\n`
            txt += `   ├ 👤 ${t.artist}\n`
            txt += `   ├ ⏱️ ${t.duration}\n`
            txt += `   ├ 💿 ${t.album}\n`
            txt += `   └ 🔗 ${t.track_url}\n\n`
        })
        
        txt += `> 💡 Download: \`${m.prefix}spdl <url>\``
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
