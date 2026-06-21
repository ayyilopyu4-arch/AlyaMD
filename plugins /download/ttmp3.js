const axios = require('axios')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: ['ttmp3', 'tiktokmp3', 'ttaudio'],
    alias: [],
    category: 'download',
    description: 'Download audio TikTok',
    usage: '.ttmp3 <url>',
    example: '.ttmp3 https://tiktok.com/...',
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
            `> \`${m.prefix}ttmp3 <url_tiktok>\`\n\n` +
            `> Contoh: \`${m.prefix}ttmp3 https://tiktok.com/@user/video/123\``
        )
    }
    
    if (!url.includes('tiktok.com')) {
        return m.reply(`❌ URL harus dari TikTok!`)
    }
    
    m.react('🎵')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/tiktok?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data?.audio) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil audio dari video ini.`)
        }
        
        const data = res.data.data
        const audioUrl = data.audio
        const title = data.music?.title || data.caption || 'TikTok Audio'
        const author = data.author?.nickname || data.music?.author || 'Unknown'
        const cover = data.music?.cover || data.author?.avatarThumb
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: false,
            fileLength: 999999999999999,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: `🎵 ${author} • ${data.music?.duration || 0}s`,
                    thumbnailUrl: cover,
                    mediaType: 2,
                    sourceUrl: url
                },
                forwardingScore: 9999,
                isForwarded: true,
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[TTMP3] Error:', err.message)
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
