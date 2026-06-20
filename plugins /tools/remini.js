const axios = require('axios')

const pluginConfig = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance/upscale gambar menjadi HD',
    usage: '.remini (reply gambar)',
    example: '.remini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`✨ *ʀᴇᴍɪɴɪ ᴇɴʜᴀɴᴄᴇ*\n\n> Kirim/reply gambar untuk di-enhance\n\n\`${m.prefix}remini\``)
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
        
        const FormData = require('form-data')
        const formData = new FormData()
        formData.append('file', buffer, { filename: 'image.jpg' })
        
        const uploadRes = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: { ...formData.getHeaders() },
            params: { reqtype: 'fileupload' },
            timeout: 60000
        })
        
        const imageUrl = uploadRes.data
        
        const res = await axios.get(`https://api.baguss.xyz/api/edits/remini?image=${encodeURIComponent(imageUrl)}`, {
            timeout: 120000
        })
        
        if (!res.data?.status || !res.data?.result?.url) {
            m.react('❌')
            return m.reply(`❌ Gagal enhance gambar`)
        }
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: { url: res.data.result.url },
            caption: `✨ *ʀᴇᴍɪɴɪ ᴇɴʜᴀɴᴄᴇ*\n\n> Size: ${res.data.result.size}`
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
