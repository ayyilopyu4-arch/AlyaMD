const axios = require('axios')

const pluginConfig = {
    name: 'tiktoksearch',
    alias: ['tts', 'searchtiktok'],
    category: 'search',
    description: 'Cari video TikTok',
    usage: '.tiktoksearch <query>',
    example: '.tiktoksearch Nahida',
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
            `> \`${m.prefix}tiktoksearch <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}tts Nahida\``
        )
    }
    
    await m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/discovery/tiktok/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const videos = res.data.result.slice(0, 5)
        const firstVideo = res.data.result[0]
        
        let caption = `🎵 *ᴛɪᴋᴛᴏᴋ sᴇᴀʀᴄʜ*\n\n`
        caption += `> Query: *${query}*\n`
        caption += `> Total: *${res.data.result.length}* video\n`
        caption += `━━━━━━━━━━━━━━━\n\n`
        
        videos.forEach((v, i) => {
            const title = v.title?.substring(0, 80) || 'TikTok Video'
            const tiktokUrl = `https://www.tiktok.com/${v.author?.username?.replace('@', '')}`
            
            caption += `╭─「 🎬 *${i + 1}* 」\n`
            caption += `┃ 📛 *ᴛɪᴛʟᴇ:*\n`
            caption += `┃ ${title}${v.title?.length > 80 ? '...' : ''}\n`
            caption += `┃\n`
            caption += `┃ 👤 *ᴀᴜᴛʜᴏʀ:* ${v.author?.name || 'Unknown'}\n`
            caption += `┃ 🔗 *ᴜsᴇʀɴᴀᴍᴇ:* ${v.author?.username || '-'}\n`
            caption += `┃ 📅 *ᴜᴘʟᴏᴀᴅ:* ${v.create_at || '-'}\n`
            caption += `┃\n`
            caption += `┃ 📊 *sᴛᴀᴛɪsᴛɪᴋ:*\n`
            caption += `┃ ▶️ \`${v.stats?.play || 0}\` • ❤️ \`${v.stats?.like || 0}\`\n`
            caption += `┃ 💬 \`${v.stats?.comment || 0}\` • 🔄 \`${v.stats?.share || 0}\`\n`
            caption += `┃\n`
            caption += `┃ 🎵 *ᴍᴜsɪᴄ:* ${v.music_info?.title || '-'}\n`
            caption += `┃ 🎤 *ᴀʀᴛɪsᴛ:* ${v.music_info?.author || '-'}\n`
            caption += `┃\n`
            caption += `┃ 🔗 *ᴛɪᴋᴛᴏᴋ:* ${tiktokUrl}\n`
            caption += `╰━━━━━━━━━━━━━━\n\n`
        })
        if (firstVideo?.videoUrl) {
            await sock.sendMessage(m.chat, {
                video: { url: firstVideo.videoUrl },
                caption: caption.trim()
            }, { quoted: m })
        } else {
            await m.reply(caption.trim())
        }
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
