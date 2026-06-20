const aienhancer = require('../../src/scraper/hd')
const axios = require('axios')
const config = require('../../config')
const sharp = require('sharp')
const FormData = require('form-data')
const pluginConfig = {
    name: 'hd2',
    alias: ['enhance2', 'upscale2', 'aienhancer'],
    category: 'tools',
    description: 'Enhance gambar menjadi HD dengan AI Enhancer',
    usage: '.hd2 (reply gambar)',
    example: '.hd2',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`✨ *ʜᴅ ᴇɴʜᴀɴᴄᴇ ᴠ2*\n\n> Kirim/reply gambar untuk di-enhance\n\n\`${m.prefix}hd2\`\n\n> ⏳ Proses membutuhkan waktu ±1 menit`)
    }
    
    m.react('⏳')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ɢᴀᴍʙᴀʀ...*\n\n> Estimasi waktu: ±1 menit\n> Mohon tunggu...`)

        async function uploadToTempfiles(buffer) {
            const form = new FormData()
            form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
            
            const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                headers: form.getHeaders(),
                timeout: 30000
            })
            
            if (response.data?.data?.url) {
                return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
            }
            throw new Error('Upload gagal')
        }

        const images = await uploadToTempfiles(buffer)
        
        const result = await aienhancer(images, { model: 3 })
        
        if (!result || !result.output) {
            m.react('❌')
            return m.reply(`❌ Gagal enhance gambar. Coba lagi nanti.`)
        }
        
        const imgRes = await axios.get(result.output, { 
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            document: Buffer.from(imgRes.data),
            mimetype: 'image/png',
            jpegThumbnail: await sharp(imgRes.data).resize(300, 300).toBuffer(),
            fileLength: 99999999999999,
            fileName: `CONVERTED BY ${config.bot.name}`,
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
