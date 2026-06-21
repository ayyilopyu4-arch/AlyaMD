const { pinterest } = require('btch-downloader')

const pluginConfig = {
    name: 'pinterestdl',
    alias: ['pindl', 'pindownload'],
    category: 'download',
    description: 'Download gambar/video Pinterest',
    usage: '.pindl <url>',
    example: '.pindl https://www.pinterest.com/pin/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}pindl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}pindl https://www.pinterest.com/pin/xxx\``
        )
    }
    
    if (!url.match(/pinterest\.com|pin\.it/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Pinterest.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴍᴇᴅɪᴀ...*`)
    
    try {
        const data = await pinterest(url)
        
        if (!data?.status || !data?.result?.result) {
            return m.reply(`❌ Gagal mengambil media. Coba link lain.`)
        }
        
        const result = data.result.result
        const mediaUrl = result.video_url || result.image
        
        if (!mediaUrl) {
            return m.reply(`❌ Media tidak ditemukan.`)
        }
        
        if (result.video_url) {
            await sock.sendMessage(m.chat, {
                video: { url: result.video_url },
                caption: `✅ *ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                    `> 🎬 Video\n` +
                    `> 👤 ${result.user?.full_name || 'Unknown'}`
            }, { quoted: m })
        } else {
            await sock.sendMessage(m.chat, {
                image: { url: result.image },
                caption: `✅ *ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                    `> 🖼️ Gambar\n` +
                    `> 👤 ${result.user?.full_name || 'Unknown'}`
            }, { quoted: m })
        }
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
