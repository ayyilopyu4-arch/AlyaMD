const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'pixeldraindl',
    alias: ['pddl', 'pixeldrain', 'pddownload'],
    category: 'download',
    description: 'Download file dari Pixeldrain',
    usage: '.pixeldraindl <url>',
    example: '.pixeldraindl https://pixeldrain.com/u/xxxxx',
    cooldown: 15,
    limit: 2,
    isEnabled: true
}

let thumbDownload = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-download.jpg')
    if (fs.existsSync(p)) thumbDownload = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbDownload) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbDownload,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function handler(m, { sock }) {
    const args = m.args || []
    const url = args[0]?.trim()
    
    if (!url || !url.includes('pixeldrain.com')) {
        return m.reply(
            `📥 *ᴘɪxᴇʟᴅʀᴀɪɴ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `> Download file dari Pixeldrain\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}pixeldraindl <url>\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}pixeldraindl https://pixeldrain.com/u/xxxxx\``
        )
    }
    
    m.react('📥')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/pixeldrain?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> File tidak ditemukan atau link tidak valid')
        }
        
        const file = data.data
        
        let text = `📥 *ᴘɪxᴇʟᴅʀᴀɪɴ*\n\n`
        text += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
        text += `┃ 📁 Filename: ${file.filename || '-'}\n`
        text += `┃ 📦 Type: ${file.type || '-'}\n`
        text += `┃ 📊 Size: ${file.size || '-'}\n`
        text += `┃ 👁️ Views: ${file.views || 0}\n`
        text += `┃ 📥 Downloads: ${file.downloads || 0}\n`
        text += `┃ 📅 Upload: ${file.upload_at ? new Date(file.upload_at).toLocaleDateString('id-ID') : '-'}\n`
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        text += `> _File akan dikirim sebagai dokumen_`
        
        await sock.sendMessage(m.chat, {
            text,
            contextInfo: getContextInfo('📥 PIXELDRAIN', file.filename || 'Download'),
            interactiveButtons: [
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📥 Download Direct',
                        url: file.url
                    })
                }
            ]
        }, { quoted: m })
        
        const sizeMatch = file.size?.match(/([\d.]+)\s*(MB|GB|KB)/i)
        let sizeInMB = 0
        if (sizeMatch) {
            const value = parseFloat(sizeMatch[1])
            const unit = sizeMatch[2].toUpperCase()
            if (unit === 'GB') sizeInMB = value * 1024
            else if (unit === 'MB') sizeInMB = value
            else if (unit === 'KB') sizeInMB = value / 1024
        }
        
        if (sizeInMB > 0 && sizeInMB <= 100) {
            await m.reply('⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ...*\n\n> Mengirim file...')
            
            const fileBuffer = await axios.get(file.url, { 
                responseType: 'arraybuffer',
                timeout: 300000
            })
            
            await sock.sendMessage(m.chat, {
                document: Buffer.from(fileBuffer.data),
                mimetype: 'application/octet-stream',
                fileName: file.filename
            }, { quoted: m })
        } else if (sizeInMB > 100) {
            await m.reply(`⚠️ *ꜰɪʟᴇ ᴛᴇʀʟᴀʟᴜ ʙᴇsᴀʀ*\n\n> File ${file.size} terlalu besar untuk dikirim\n> Gunakan link download di atas`)
        }
        
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
