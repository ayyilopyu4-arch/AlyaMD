const axios = require('axios')
const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const { downloadContentFromMessage } = require('ourin')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'nanobanana2',
    alias: ['nano2', 'cartoon', 'toonify', 'cartoonize'],
    category: 'ai',
    description: 'Transform gambar dengan AI NanoBanana',
    usage: '.nanobanana2 <prompt> (reply gambar)',
    example: '.nanobanana2 transform into cartoon style',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 3,
    isEnabled: true
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 60000
    })
    
    if (res.data?.data?.url) {
        return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    throw new Error('Failed to upload to tmpfiles.org')
}

async function handler(m, { sock }) {
    const prompt = m.text?.trim() || 'transform this photo into cartoon style'
    
    if (!m.quoted && !m.isMedia) {
        return m.reply(
            `🎨 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ v2*\n\n` +
            `> Reply gambar dengan prompt transform\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}nanobanana2 <prompt>\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}nanobanana2 transform into cartoon style\`\n` +
            `> \`${m.prefix}nanobanana2 make it anime style\`\n` +
            `> \`${m.prefix}nanobanana2 turn into oil painting\``
        )
    }
    
    const quoted = m.quoted
    let mediaMessage = null
    
    if (quoted?.type === 'imageMessage') {
        mediaMessage = quoted
    } else if (m.type === 'imageMessage') {
        mediaMessage = m
    }
    
    if (!mediaMessage) {
        return m.reply(`❌ Reply gambar untuk di-transform!`)
    }
    
    m.react('🎨')
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ɢᴀᴍʙᴀʀ...*`)
    
    try {
        const stream = await downloadContentFromMessage(
            mediaMessage.message[mediaMessage.type],
            'image'
        )
        
        const chunks = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)
        
        await m.reply(`📤 *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ɢᴀᴍʙᴀʀ...*`)
        
        const imageUrl = await uploadToTmpFiles(buffer, `nano2_${Date.now()}.jpg`)
        
        await m.reply(`🎨 *ᴛʀᴀɴsꜰᴏʀᴍɪɴɢ...*\n\n> Prompt: ${prompt}`)
        
        const apiUrl = `https://api.neoxr.eu/api/nano-banana?image=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`
        
        const res = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!res.data?.status || !res.data?.data?.url) {
            m.react('❌')
            return m.reply(`❌ Gagal transform gambar!`)
        }
        
        const resultUrl = res.data.data.url
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            image: { url: resultUrl },
            caption: `🎨 *ɴᴀɴᴏʙᴀɴᴀɴᴀ ᴀɪ v2*\n\n> Prompt: ${prompt}`,
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
        console.error('[NanoBanana2] Error:', err.message)
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
