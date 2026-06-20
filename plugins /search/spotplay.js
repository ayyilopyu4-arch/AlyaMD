const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const config = require('../../config')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'spotplay',
    alias: ['splay', 'sp'],
    category: 'search',
    description: 'Putar musik dari Spotify',
    usage: '.spotplay <query>',
    example: '.spotplay neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 1,
    isEnabled: true
}

function parseDuration(durationStr) {
    if (!durationStr) return 0
    const parts = durationStr.split(':').map(Number)
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}spotplay <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}spotplay neffex grateful\``
        )
    }
    
    m.react("🎧")
    
    try {
        const searchRes = await axios.get(`https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(query)}`)
        
        if (!searchRes.data?.status || !searchRes.data?.data?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const track = searchRes.data.data[0]
        
        const dlRes = await axios.get(`https://api.siputzx.my.id/api/d/spotifyv2?url=${encodeURIComponent(track.track_url)}`)
        
        if (!dlRes.data?.status || !dlRes.data?.data?.mp3DownloadLink) {
            return m.reply(`❌ Gagal mendapatkan link download.`)
        }

        const result = dlRes.data.data
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempMp3 = path.join(tempDir, `spotplay_${Date.now()}.mp3`)
        const tempOgg = path.join(tempDir, `spotplay_${Date.now()}.ogg`)
 
        const mp3Res = await axios.get(result.mp3DownloadLink, { responseType: 'arraybuffer' })
        fs.writeFileSync(tempMp3, Buffer.from(mp3Res.data))
        
        const durationSeconds = parseDuration(track.duration)
        const maxVnDuration = 5 * 60
        const sendAsVn = durationSeconds <= maxVnDuration
        
        let audioBuffer = fs.readFileSync(tempMp3)
        let mimetype = 'audio/mpeg'
        
        if (sendAsVn) {
            try {
                await execAsync(`ffmpeg -i "${tempMp3}" -af "aresample=48000,loudnorm=I=-14:TP=-2:LRA=7" -c:a libopus -b:a 128k -ar 48000 -ac 2 -application audio -vn -y "${tempOgg}"`)
                if (fs.existsSync(tempOgg) && fs.statSync(tempOgg).size > 1000) {
                    audioBuffer = fs.readFileSync(tempOgg)
                    mimetype = 'audio/ogg; codecs=opus'
                }
                if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg)
            } catch (e) {}
        }
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: mimetype,
            ptt: sendAsVn,
            fileName: sendAsVn ? undefined : `${result.songTitle} - ${result.artist}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: result.songTitle || track.title,
                    body: sendAsVn ? `${track.duration} • Voice Note` : `${track.duration} • Audio File`,
                    thumbnailUrl: result.coverImage || track.thumbnail,
                    mediaType: 2,
                    sourceUrl: track.track_url
                },
                isForwarded: true,
                forwardingScore: 999,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.saluran?.id,
                    newsletterName: config.saluran?.name
                }
            }
        }, { quoted: m })
        
        if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
