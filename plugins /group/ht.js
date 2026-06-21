const { getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'ht',
    alias: ['htreply', 'htr'],
    category: 'group',
    description: 'Hidetag dengan support reply pesan (teks/media)',
    usage: '.ht [pesan] atau reply pesan',
    example: '.ht atau reply pesan lalu .ht',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []
        const mentions = getParticipantJids(participants)
        
        const quoted = m.quoted
        const text = m.text || ''
        
        if (quoted) {
            const quotedType = Object.keys(quoted.message || {})[0]
            const isImage = quoted.isImage || quotedType === 'imageMessage'
            const isVideo = quoted.isVideo || quotedType === 'videoMessage'
            const isSticker = quotedType === 'stickerMessage'
            const isDocument = quotedType === 'documentMessage'
            const isAudio = quotedType === 'audioMessage'
            
            if (isImage) {
                const media = await quoted.download()
                const caption = quoted.message?.imageMessage?.caption || text || ''
                await sock.sendMessage(m.chat, {
                    image: media,
                    caption: caption,
                    mentions
                })
            } else if (isVideo) {
                const media = await quoted.download()
                const caption = quoted.message?.videoMessage?.caption || text || ''
                await sock.sendMessage(m.chat, {
                    video: media,
                    caption: caption,
                    mentions
                })
            } else if (isSticker) {
                const media = await quoted.download()
                await sock.sendMessage(m.chat, {
                    sticker: media
                })
                if (text) {
                    await sock.sendMessage(m.chat, {
                        text: text,
                        mentions
                    })
                }
            } else if (isAudio) {
                const media = await quoted.download()
                await sock.sendMessage(m.chat, {
                    audio: media,
                    mimetype: 'audio/mp4',
                    ptt: quoted.message?.audioMessage?.ptt || false
                })
                if (text) {
                    await sock.sendMessage(m.chat, {
                        text: text,
                        mentions
                    })
                }
            } else if (isDocument) {
                const media = await quoted.download()
                const docMsg = quoted.message?.documentMessage || {}
                await sock.sendMessage(m.chat, {
                    document: media,
                    mimetype: docMsg.mimetype || 'application/octet-stream',
                    fileName: docMsg.fileName || 'file'
                })
                if (text) {
                    await sock.sendMessage(m.chat, {
                        text: text,
                        mentions
                    })
                }
            } else {
                const quotedText = quoted.text || quoted.message?.conversation || 
                                   quoted.message?.extendedTextMessage?.text || ''
                const finalText = text || quotedText
                
                if (!finalText) {
                    return m.reply(`❌ *ᴘᴇsᴀɴ ᴋᴏsᴏɴɢ*\n\n> Reply pesan atau masukkan teks!`)
                }
                
                await sock.sendMessage(m.chat, {
                    text: finalText,
                    mentions
                })
            }
        } else {
            if (!text) {
                return m.reply(
                    `📢 *ʜɪᴅᴇᴛᴀɢ ʀᴇᴘʟʏ*\n\n` +
                    `> Cara pakai:\n` +
                    `> 1. Reply pesan lalu ketik \`${m.prefix}ht\`\n` +
                    `> 2. Atau ketik \`${m.prefix}ht <pesan>\`\n\n` +
                    `> Support: teks, gambar, video, sticker, audio, dokumen`
                )
            }
            
            await sock.sendMessage(m.chat, {
                text: text,
                mentions
            })
        }
        
    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
