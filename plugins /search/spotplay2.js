const spotify = require('../../src/scraper/spotify')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'spotplay2',
    alias: ['splay2', 'sp2'],
    category: 'search',
    description: 'Putar musik dari Spotify (V2)',
    usage: '.spotplay2 <query>',
    example: '.spotplay2 neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `🎵 *sᴘᴏᴛɪғʏ ᴘʟᴀʏ ᴠ2*\n\n` +
            `> Cari dan putar lagu dari Spotify\n\n` +
            `*Contoh:*\n` +
            `> ${m.prefix}spotplay2 neffex grateful`
        )
    }
    
    await m.reply(`🔍 *ᴍᴇɴᴄᴀʀɪ:* ${query}...`)
    
    try {
        const searchRes = await axios.get(`https://api.nekolabs.web.id/dsc/spotify/search?q=${encodeURIComponent(query)}`)
        
        if (!searchRes.data?.success || !searchRes.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: *${query}*`)
        }
        
        const track = searchRes.data.result[0]
        const trackUrl = track.url
        
        await m.reply(`⏳ *sᴇᴅᴀɴɢ ᴍᴇɴɢᴜɴᴅᴜʜ...*\n> ${track.title} - ${track.artist}`)
        
        const result = await spotify.download(trackUrl)
        
        if (!result.status) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.msg || 'Unknown error'}`)
        }
        
        const { metadata, download } = result
        const downloadUrl = download.mp3 || download.flac
        
        if (!downloadUrl) {
            return m.reply(`❌ Link download tidak tersedia!`)
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempFile = path.join(tempDir, `spotplay_${Date.now()}.mp3`)
        
        const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
        fs.writeFileSync(tempFile, Buffer.from(audioRes.data))
        
        const audioBuffer = fs.readFileSync(tempFile)
        
        let thumbnail = null
        try {
            const thumbRes = await axios.get(metadata.cover, { responseType: 'arraybuffer' })
            thumbnail = Buffer.from(thumbRes.data)
        } catch (e) {}
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${metadata.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: metadata.title,
                    body: metadata.artist,
                    thumbnailUrl: metadata.cover,
                    thumbnail: thumbnail,
                    mediaType: 2,
                    mediaUrl: trackUrl,
                    sourceUrl: trackUrl,
                    renderLargerThumbnail: true
                },
                forwardedNewsletterMessageInfo: {
                    newsletterName: config.saluran?.name || config.bot?.name || 'Spotify',
                    newsletterJid: config.saluran?.id || ''
                },
                isForwarded: true,
                forwardingScore: 999
            }
        }, { quoted: m })
        
        fs.unlinkSync(tempFile)
        
    } catch (err) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
