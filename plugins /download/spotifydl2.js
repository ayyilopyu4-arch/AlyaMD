const spotify = require('../../src/scraper/spotify')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'spotifydl2',
    alias: ['spdl2', 'spotify-dl2'],
    category: 'download',
    description: 'Download lagu dari Spotify (V2)',
    usage: '.spdl2 <url>',
    example: '.spdl2 https://open.spotify.com/track/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `🎵 *sᴘᴏᴛɪғʏ ᴅᴏᴡɴʟᴏᴀᴅ ᴠ2*\n\n` +
            `> Masukkan link Spotify track\n\n` +
            `*Contoh:*\n` +
            `> ${m.prefix}spdl2 https://open.spotify.com/track/xxx`
        )
    }
    
    if (!url.match(/open\.spotify\.com\/(track|intl-\w+\/track)/i)) {
        return m.reply(`❌ URL tidak valid!\n> Gunakan link Spotify track.`)
    }
    
    await m.reply(`⏳ *sᴇᴅᴀɴɢ ᴍᴇɴɢᴜɴᴅᴜʜ...*`)
    
    try {
        const result = await spotify.download(url)
        
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
        
        const tempFile = path.join(tempDir, `spotify_${Date.now()}.mp3`)
        
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
                    mediaUrl: url,
                    sourceUrl: url,
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
        
        let txt = `🎵 *sᴘᴏᴛɪғʏ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n`
        txt += `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n`
        txt += `┃ 🎶 Title: *${metadata.title}*\n`
        txt += `┃ 👤 Artist: *${metadata.artist}*\n`
        txt += `┃ 💿 Album: *${metadata.album}*\n`
        txt += `┃ 📅 Release: *${metadata.releaseDate}*\n`
        txt += `┃ 🎧 FLAC: *${metadata.isFlacAvailable ? 'Tersedia' : 'Tidak'}*\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.reply(txt)
        
    } catch (err) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
