const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'spotifydl',
    alias: ['spdl', 'spotify-dl', 'spotdl'],
    category: 'download',
    description: 'Download lagu dari Spotify',
    usage: '.spdl <url>',
    example: '.spdl https://open.spotify.com/track/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `🎵 *sᴘᴏᴛɪꜰʏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ \`${m.prefix}spdl <url>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}spdl https://open.spotify.com/track/xxx\``
        )
    }
    
    if (!url.match(/open\.spotify\.com\/track/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Spotify track.`)
    }
    
    m.react('🎵')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/spotify?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!data?.status || !data?.data) {
            throw new Error('API tidak mengembalikan data yang valid')
        }
        
        const result = data.data
        
        if (!result.url) {
            return m.reply(`❌ Link download tidak tersedia untuk lagu ini.`)
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        let caption = `🎵 *sᴘᴏᴛɪꜰʏ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n`
        caption += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
        caption += `┃ 🎶 *${result.title || 'Unknown'}*\n`
        caption += `┃ 👤 ${result.artist?.name || 'Unknown Artist'}\n`
        caption += `┃ ⏱️ ${result.duration || '-'}\n`
        caption += `╰┈┈⬡`
        
        await sock.sendMessage(m.chat, {
            audio: { url: result.url },
            mimetype: 'audio/mpeg',
            fileName: `${result.title || 'spotify'}.mp3`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                },
                externalAdReply: {
                    title: result.title || 'Spotify Download',
                    body: result.artist?.name || 'Unknown Artist',
                    thumbnailUrl: result.thumbnail,
                    mediaType: 2,
                    sourceUrl: result.artist?.external_urls?.spotify || url
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
