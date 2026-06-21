const { tiktok } = require('../../src/scraper/tiktok')
const config = require('../../config')
const axios = require('axios')

const pluginConfig = {
    name: ['tiktok', 'tt', 'ttmp4'],
    alias: ['tiktokdl', 'ttdown'],
    category: 'download',
    description: 'Download video TikTok tanpa watermark',
    usage: '.tiktok <url>',
    example: '.tiktok https://vt.tiktok.com/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

function formatNumber(num) {
    if (!num) return '0'
    const n = parseInt(num)
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}tiktok <url>\`
╰┈┈⬡

> \`Contoh: ${m.prefix}tiktok https://vt.tiktok.com/xxx\``
        )
    }
    
    if (!url.match(/tiktok\.com|vt\.tiktok/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link TikTok.`)
    }
    
    m.react('🎵')
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*\n\n> _Scraping langsung dari TikTok..._`)
    
    try {
        const result = await tiktok(url)
        
        if (!result?.status || !result?.result) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil video. ${result?.error || 'Coba link lain.'}`)
        }
        
        const data = result.result
        const videoUrl = data.cloudUrl?.hd_nonwatermark || data.cloudUrl?.watermark || data.originalUrl?.hd_nonwatermark || data.originalUrl?.watermark
        
        if (!videoUrl) {
            m.react('❌')
            return m.reply(`❌ Video tidak ditemukan. URL tidak valid.`)
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const caption = `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅ* 」
┃ 📝 *${(data.metadata?.description || 'No Title').substring(0, 80)}*
╰┈┈⬡

╭┈┈⬡「 👤 *ᴀᴜᴛʜᴏʀ* 」
┃ ㊗ ᴜsᴇʀɴᴀᴍᴇ: @${data.author?.uniqueId || '-'}
┃ ㊗ ɴɪᴄᴋɴᴀᴍᴇ: ${data.author?.nickname || '-'}
╰┈┈⬡

╭┈┈⬡「 🎶 *ᴍᴜsɪᴄ* 」
┃ ㊗ ᴛɪᴛʟᴇ: ${data.music?.title || '-'}
┃ ㊗ ᴀʀᴛɪsᴛ: ${data.music?.author || '-'}
╰┈┈⬡

╭┈┈⬡「 📊 *sᴛᴀᴛs* 」
┃ ▶️ ᴠɪᴇᴡs: ${formatNumber(data.stats?.views)}
┃ ❤️ ʟɪᴋᴇs: ${formatNumber(data.stats?.likes)}
┃ 💬 ᴄᴏᴍᴍᴇɴᴛs: ${formatNumber(data.stats?.comments)}
┃ 🔗 sʜᴀʀᴇs: ${formatNumber(data.stats?.shares)}
╰┈┈⬡

> ⏱️ ᴅᴜʀᴀᴛɪᴏɴ: \`${data.videoInfo?.duration || 0}s\`
> 📐 ʀᴇsᴏʟᴜᴛɪᴏɴ: \`${data.videoInfo?.resolution || '-'}\``
        
        const buttons = [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🎵 Download Audio',
                    id: `${m.prefix}ttmp3 ${url}`
                })
            }
        ];
        
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
            },
            interactiveButtons: buttons,
            footer: 'TT DOWNLOADER',
            headerType: 4
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[TikTokDL] Error:', err)
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
