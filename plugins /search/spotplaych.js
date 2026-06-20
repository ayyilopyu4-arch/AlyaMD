const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const config = require('../../config')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'spotplaych',
    alias: ['spch', 'spotifych'],
    category: 'search',
    description: 'Putar musik dari Spotify ke saluran',
    usage: '.spotplaych <query> | <idch>',
    example: '.spotplaych neffex grateful | 120363xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    limit: 0,
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
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `📢 *sᴘᴏᴛɪꜰʏ ᴛᴏ ᴄʜᴀɴɴᴇʟ*\n\n` +
            `> \`${m.prefix}spotplaych <query>\` → Kirim ke saluran default\n` +
            `> \`${m.prefix}spotplaych <query> | <idch>\` → Kirim ke saluran tertentu\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}spotplaych neffex grateful\`\n` +
            `> \`${m.prefix}spotplaych garam dan madu | 120363xxx\``
        )
    }

    let query = text
    let channelId = config.saluran?.id
    
    if (text.includes('|')) {
        const parts = text.split('|').map(p => p.trim())
        query = parts[0]
        const targetId = parts[1]
        
        if (targetId) {
            channelId = targetId.includes('@newsletter') ? targetId : `${targetId}@newsletter`
        }
    }
    
    if (!channelId) {
        return m.reply(`❌ ID saluran tidak ditemukan! Set di config.saluran.id atau pakai format: .spotplaych query | idch`)
    }

    m.react("🎧")
    await m.reply(`📢 Mengirim ke saluran...\n> Target: ${channelId.split('@')[0]}\n> Converting to OGG Opus...`)
    
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
        
        const tempMp3 = path.join(tempDir, `spotplaych_${Date.now()}.mp3`)
        const tempOgg = path.join(tempDir, `spotplaych_${Date.now()}.ogg`)
 
        const mp3Res = await axios.get(result.mp3DownloadLink, { responseType: 'arraybuffer' })
        fs.writeFileSync(tempMp3, Buffer.from(mp3Res.data))
        
        try {
            await execAsync(`ffmpeg -i "${tempMp3}" -c:a libopus -b:a 128k -ar 48000 -ac 2 -vn -y "${tempOgg}"`)
        } catch (ffmpegErr) {
            if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
            return m.reply(`❌ FFmpeg error: ${ffmpegErr.message}`)
        }
        
        if (!fs.existsSync(tempOgg) || fs.statSync(tempOgg).size < 1000) {
            if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
            if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg)
            return m.reply(`❌ Gagal convert ke OGG Opus`)
        }
        
        const audioBuffer = fs.readFileSync(tempOgg)
        
        await sock.sendMessage(channelId, {
            audio: audioBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            fileName: `${result.songTitle?.substring(0, 30) || 'audio'}.ogg`,
            ptt: false
        })
        
        if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
        if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg)
        
        m.react('✅')
        m.reply(`✅ Berhasil dikirim ke saluran!\n\n> 🎵 ${result.songTitle}\n> 🎤 ${result.artist}\n> ⏱️ ${track.duration}`)
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
