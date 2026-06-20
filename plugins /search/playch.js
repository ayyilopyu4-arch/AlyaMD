const axios = require('axios')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const config = require('../../config')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'playch',
    alias: ['pch', 'playChannel'],
    category: 'search',
    description: 'Putar musik dari YouTube ke saluran',
    usage: '.playch <query> | <idch>',
    example: '.playch neffex grateful | 120363xxx',
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
            `📢 *ᴘʟᴀʏ ᴛᴏ ᴄʜᴀɴɴᴇʟ*\n\n` +
            `> \`${m.prefix}playch <query>\` → Kirim ke saluran default\n` +
            `> \`${m.prefix}playch <query> | <idch>\` → Kirim ke saluran tertentu\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}playch neffex grateful\`\n` +
            `> \`${m.prefix}playch garam dan madu | 120363xxx\``
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
        return m.reply(`❌ ID saluran tidak ditemukan! Set di config.saluran.id atau pakai format: .playch query | idch`)
    }

    m.react("🎧")
    await m.reply(`📢 Mengirim ke saluran...\n> Target: ${channelId.split('@')[0]}\n> Converting to OGG Opus...`)
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const { metadata, downloadUrl } = res.data.result
        
        if (!downloadUrl) {
            return m.reply(`❌ Gagal mendapatkan link download.`)
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempMp3 = path.join(tempDir, `playch_${Date.now()}.mp3`)
        const tempOgg = path.join(tempDir, `playch_${Date.now()}.ogg`)

        const mp3Res = await axios.get(downloadUrl, { responseType: 'arraybuffer' })
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
            fileName: `${metadata.title?.substring(0, 30) || 'audio'}.ogg`,
            ptt: false
        })
        
        if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
        if (fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg)
        
        m.react('✅')
        m.reply(`✅ Berhasil dikirim ke saluran!\n\n> 🎵 ${metadata.title}\n> ⏱️ ${metadata.duration}`)
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
