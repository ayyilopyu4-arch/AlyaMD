const axios = require('axios')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'ytmp4',
    alias: ['youtubemp4', 'ytvideo'],
    category: 'download',
    description: 'Download video YouTube',
    usage: '.ytmp4 <url>',
    example: '.ytmp4 https://youtube.com/watch?v=xxx',
    cooldown: 20,
    limit: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url) return m.reply(`Contoh: ${m.prefix}ytmp4 https://youtube.com/watch?v=xxx`)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return m.reply('❌ URL harus YouTube')

    m.react('🎬')

    try {
        const apiUrl =
            `https://api.neoxr.eu/api/youtube` +
            `?url=${encodeURIComponent(url)}` +
            `&type=video&quality=720p` +
            `&apikey=${NEOXR_APIKEY}`

        const { data } = await axios.get(apiUrl)
        if (!data.status) throw new Error('Gagal mengambil video')

        const info = data
        const videoUrl = data.data.url

        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption:
                `🎬 *${info.title}*\n\n` +
                `> Channel: ${info.channel}\n` +
                `> Duration: ${info.fduration}\n` +
                `> Views: ${info.views}`,
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
        console.error('[YTMP4]', err)
        m.react('❌')
        m.reply('Gagal mengunduh video.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
                }

