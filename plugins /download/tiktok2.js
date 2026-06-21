const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: ['tiktok2', 'tt2', 'ttmp42'],
    alias: [],
    category: 'download',
    description: 'Download video TikTok tanpa watermark (API 2)',
    usage: '.tiktok2 <url>',
    example: '.tiktok2 https://vt.tiktok.com/xxx',
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
            `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ ᴠ2* 」
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}tiktok2 <url>\`
╰┈┈⬡

> \`Contoh: ${m.prefix}tiktok2 https://vt.tiktok.com/xxx\``
        )
    }
    
    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link TikTok.`)
    }
    
    m.react('🎵')
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const apiUrl = `https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil video. Coba link lain.`)
        }
        
        const result = data.result
        const videoUrl = result.videoUrl
        
        if (!videoUrl) {
            m.react('❌')
            return m.reply(`❌ Video tidak ditemukan.`)
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const caption = `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」
┃ 📝 *${result.title?.substring(0, 80) || 'No Title'}*
╰┈┈⬡

╭┈┈⬡「 👤 *ᴀᴜᴛʜᴏʀ* 」
┃ ㊗ ɴᴀᴍᴇ: ${result.author?.name || '-'}
┃ ㊗ ᴜsᴇʀɴᴀᴍᴇ: ${result.author?.username || '-'}
╰┈┈⬡

╭┈┈⬡「 🎶 *ᴍᴜsɪᴄ* 」
┃ ㊗ ᴛɪᴛʟᴇ: ${result.music_info?.title || '-'}
┃ ㊗ ᴀʀᴛɪsᴛ: ${result.music_info?.author || '-'}
╰┈┈⬡

╭┈┈⬡「 📊 *sᴛᴀᴛs* 」
┃ ▶️ ᴠɪᴇᴡs: ${result.stats?.play || '0'}
┃ ❤️ ʟɪᴋᴇs: ${result.stats?.like || '0'}
┃ 💬 ᴄᴏᴍᴍᴇɴᴛs: ${result.stats?.comment || '0'}
┃ 🔗 sʜᴀʀᴇs: ${result.stats?.share || '0'}
╰┈┈⬡

> 📅 ᴄʀᴇᴀᴛᴇᴅ: \`${result.create_at || '-'}\`
> 🎧 ᴛɪᴘs: \`${m.prefix}ttmp3 <url>\` untuk audio`
        
        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
