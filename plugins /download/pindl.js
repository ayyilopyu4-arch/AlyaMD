const pindl = require('../../src/scraper/pindl')
const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'pindl',
    alias: ['pinterest', 'pin', 'pindownload'],
    category: 'download',
    description: 'Download video/gambar/gif dari Pinterest',
    usage: '.pindl <url>',
    example: '.pindl https://pinterest.com/pin/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `> Masukkan URL Pinterest\n\n` +
            `\`${m.prefix}pindl https://pinterest.com/pin/xxx\``
        )
    }
    
    if (!url.includes('pinterest')) {
        return m.reply(`❌ URL tidak valid! Harus URL Pinterest.`)
    }
    
    m.react('⏳')
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengunduh dari Pinterest...`)
    
    try {
        const result = await pindl(url)
        
        if (!result || !result.media || result.media.length === 0) {
            m.react('❌')
            return m.reply(`❌ Gagal mengunduh! URL tidak valid atau konten tidak tersedia.`)
        }
        
        const media = result.media[0]
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const caption = `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ ◦ Title: *${result.title || '-'}*\n` +
            `┃ ◦ Author: *${result.author?.name || '-'}* (@${result.author?.username || '-'})\n` +
            `┃ ◦ Likes: *${result.stats?.likes || 0}*\n` +
            `┃ ◦ Shares: *${result.stats?.shares || 0}*\n` +
            `┃ ◦ Type: *${media.type?.toUpperCase()}*\n` +
            `┃ ◦ Quality: *${media.quality}*\n` +
            `┃ ◦ Size: *${media.size}*\n` +
            `╰┈┈⬡\n\n` +
            (result.description !== '-' ? `> _${result.description}_` : '')
        
        const mediaBuffer = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        const messageContent = {
            caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }
        
        if (media.type === 'video') {
            messageContent.video = Buffer.from(mediaBuffer.data)
        } else if (media.type === 'image') {
            messageContent.image = Buffer.from(mediaBuffer.data)
        } else {
            messageContent.document = Buffer.from(mediaBuffer.data)
            messageContent.mimetype = 'image/gif'
            messageContent.fileName = 'pinterest.gif'
        }
        
        await sock.sendMessage(m.chat, messageContent, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
