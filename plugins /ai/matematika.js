const axios = require('axios')
const { uploadImage } = require('../../src/lib/uploader')

const pluginConfig = {
    name: 'matematika',
    alias: ['mathgpt', 'math', 'mathsolver'],
    category: 'ai',
    description: 'AI untuk menyelesaikan soal matematika',
    usage: '.matematika <soal> atau reply gambar soal',
    example: '.matematika 2+2 berapa?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    let imageUrl = ''
    
    if (m.quoted && m.quoted.type === 'imageMessage') {
        try {
            const buffer = await m.quoted.download()
            imageUrl = await uploadImage(buffer, 'image.jpg')
        } catch (e) {}
    } else if (m.isImage) {
        try {
            const buffer = await m.download()
            imageUrl = await uploadImage(buffer, 'image.jpg')
        } catch (e) {}
    }
    
    if (!text && !imageUrl) {
        return m.reply(`📐 *ᴍᴀᴛʜ ɢᴘᴛ*\n\n> Masukkan soal matematika atau kirim/reply gambar soal\n\n\`Contoh: ${m.prefix}matematika 2+2 berapa?\``)
    }
    
    m.react('📐')
    
    try {
        let url = `https://api.nekolabs.web.id/text.gen/mathgpt?text=${encodeURIComponent(text || 'solve this')}`
        if (imageUrl) {
            url += `&imageUrl=${encodeURIComponent(imageUrl)}`
        }
        
        const { data } = await axios.get(url, { timeout: 60000 })
        
        if (!data?.success || !data?.result) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        const answer = data.result?.content || data.result
        
        m.react('✅')
        await m.reply(`📐 *ᴍᴀᴛʜ ɢᴘᴛ*\n\n${answer}`)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
