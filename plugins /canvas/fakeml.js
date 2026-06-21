const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'fakeml',
    alias: ['mlbbfake', 'mlcard', 'mlfake'],
    category: 'canvas',
    description: 'Membuat fake ML profile card',
    usage: '.fakeml <nama> (reply/kirim foto)',
    example: '.fakeml Misaki',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

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

async function handler(m, { sock }) {
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `🎮 *ꜰᴀᴋᴇ ᴍʟ ᴘʀᴏꜰɪʟᴇ*\n\n` +
            `> Masukkan nama untuk profile\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> 1. Kirim foto + caption \`${m.prefix}fakeml <nama>\`\n` +
            `> 2. Reply foto dengan \`${m.prefix}fakeml <nama>\``
        )
    }
    
    let buffer = null
    
    if (m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.mtype === 'imageMessage')) {
        try {
            buffer = await m.quoted.download()
        } catch (e) {
            return m.reply(`❌ Gagal download gambar: ${e.message}`)
        }
    } else if (m.isMedia && m.type === 'imageMessage') {
        try {
            buffer = await m.download()
        } catch (e) {
            return m.reply(`❌ Gagal download gambar: ${e.message}`)
        }
    }
    
    if (!buffer) {
        return m.reply(`❌ Kirim/reply gambar untuk dijadikan avatar!`)
    }
    
    m.react('🎮')
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ꜰᴀᴋᴇ ᴍʟ...*`)
    
    try {
        const imageUrl = await uploadToTempfiles(buffer)
        
        const apiUrl = `https://zelapioffciall.koyeb.app/canvas/mlbb?url=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(name)}`
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 60000 
        })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `🎮 *ꜰᴀᴋᴇ ᴍʟ ᴘʀᴏꜰɪʟᴇ*\n\n> Nama: *${name}*`
        }, { quoted: m })
        
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
