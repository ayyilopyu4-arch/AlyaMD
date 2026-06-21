const { threads } = require('btch-downloader')

const pluginConfig = {
    name: 'threaddl',
    alias: ['tdl', 'threads', 'threadsdl'],
    category: 'download',
    description: 'Download video/foto Threads',
    usage: '.tdl <url>',
    example: '.tdl https://www.threads.net/@xxx/post/xxx',
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
            `> \`${m.prefix}tdl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}tdl https://www.threads.net/@xxx/post/xxx\``
        )
    }
    
    if (!url.match(/threads\.net/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Threads.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴍᴇᴅɪᴀ...*`)
    
    try {
        const data = await threads(url)
        
        if (!data?.status || !data?.result) {
            return m.reply(`❌ Gagal mengambil media. Coba link lain.`)
        }
        
        const result = data.result
        const mediaUrl = result.video || result.image
        const mediaType = result.type || 'image'
        
        if (!mediaUrl) {
            return m.reply(`❌ Media tidak ditemukan.`)
        }
        
        if (mediaType === 'video' || result.video) {
            try {
                await sock.sendMessage(m.chat, {
                    video: { url: mediaUrl },
                    caption: `✅ *ᴛʜʀᴇᴀᴅs ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> 🎬 Video`
                }, { quoted: m })
            } catch (vidErr) {
                await sock.sendMessage(m.chat, {
                    image: { url: mediaUrl },
                    caption: `✅ *ᴛʜʀᴇᴀᴅs ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> 🖼️ Gambar`
                }, { quoted: m })
            }
        } else {
            await sock.sendMessage(m.chat, {
                image: { url: mediaUrl },
                caption: `✅ *ᴛʜʀᴇᴀᴅs ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n> 🖼️ Gambar`
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
