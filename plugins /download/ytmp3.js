const axios = require('axios')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const { exec } = require('child_process')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'ytmp3',
    alias: ['youtubemp3', 'ytaudio'],
    category: 'download',
    description: 'Download audio YouTube',
    usage: '.ytmp3 <url>',
    example: '.ytmp3 https://youtube.com/watch?v=xxx',
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url) return m.reply(`Contoh: ${m.prefix}ytmp3 https://youtube.com/watch?v=xxx`)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return m.reply('❌ URL harus YouTube')

    m.react('🎵')

    try {
        const apiUrl =
            `https://api.neoxr.eu/api/youtube` +
            `?url=${encodeURIComponent(url)}` +
            `&type=audio&quality=128kbps` +
            `&apikey=${NEOXR_APIKEY}`

        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        if (!data.status) throw new Error('Gagal mengambil audio')
        const info = data
        const audioUrl = data.data.url
        const tmpDir = path.join(__dirname, '../../temp')
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)
        const rawPath = path.join(tmpDir, `raw-${Date.now()}.bin`)
        const mp3Path = path.join(tmpDir, `audio-${Date.now()}.mp3`)
        const audioRes = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })

        fs.writeFileSync(rawPath, Buffer.from(audioRes.data))
        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -y -i "${rawPath}" -vn -acodec libmp3lame -ab 128k "${mp3Path}"`,
                err => err ? reject(err) : resolve()
            )
        })
        const thumb = await axios.get(info.thumbnail, { responseType: 'arraybuffer' })
        await sock.sendMessage(m.chat, {
            audio: fs.readFileSync(mp3Path),
            mimetype: 'audio/mpeg',
            fileName: `${info.title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: info.title,
                    body: `${info.channel} • ${info.fduration}`,
                    thumbnailUrl: info.thumbnail,
                    mediaType: 1,
                    sourceUrl: url
                }
            }
        }, { quoted: m })

        fs.unlinkSync(rawPath)
        fs.unlinkSync(mp3Path)

        m.react('✅')

    } catch (err) {
        console.error('[YTMP3]', err)
        m.react('❌')
        m.reply('Gagal mengunduh audio.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
