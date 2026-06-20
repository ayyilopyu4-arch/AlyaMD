const { pinterest } = require('btch-downloader')
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('ourin')
const axios = require('axios')

const pluginConfig = {
    name: 'pins',
    alias: ['pinsearch', 'pinterestsearch'],
    category: 'search',
    description: 'Cari gambar di Pinterest dengan carousel',
    usage: '.pins <query>',
    example: '.pins Zhao Lusi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `🔍 *ᴘɪɴᴛᴇʀᴇsᴛ sᴇᴀʀᴄʜ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ 📝 \`${m.prefix}pins <query>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Contoh: \`${m.prefix}pins Zhao Lusi\``
        )
    }
    
    m.react('🔍')
    await m.reply(`🔍 *ᴍᴇɴᴄᴀʀɪ:* ${query}...`)
    
    try {
        const data = await pinterest(query)
        
        if (!data?.result?.result?.result || data.result.result.result.length === 0) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const results = data.result.result.result.slice(0, 5)
        
        const carouselCards = []
        
        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const imageUrl = item.image_url || item.images?.orig?.url || item.images?.['736x']?.url
            
            if (!imageUrl) continue
            
            let cardMedia = null
            try {
                const response = await axios.get(imageUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 10000
                })
                const imageBuffer = Buffer.from(response.data)
                
                cardMedia = await prepareWAMessageMedia({
                    image: imageBuffer
                }, {
                    upload: sock.waUploadToServer
                })
            } catch (e) {
                console.error('[Pins] Image download error:', e.message)
                continue
            }
            
            const cardBody = `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                `┃ 📛 ᴛɪᴛʟᴇ: \`${(item.title || 'Pinterest').substring(0, 50)}\`\n` +
                `┃ 👤 ᴜᴘʟᴏᴀᴅᴇʀ: \`${item.uploader?.full_name || 'Unknown'}\`\n` +
                `╰┈┈⬡\n\n` +
                `> Gambar ${i + 1} dari ${results.length}`
            
            const cardMessage = {
                header: proto.Message.InteractiveMessage.Header.fromObject({
                    title: `🔍 ${query.substring(0, 30)}`,
                    hasMediaAttachment: true,
                    ...(cardMedia || {})
                }),
                body: proto.Message.InteractiveMessage.Body.fromObject({
                    text: cardBody
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({
                    text: `${botConfig.bot?.name || 'Ourin'} • Pinterest`
                }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    buttons: []
                })
            }
            
            carouselCards.push(cardMessage)
        }
        
        if (carouselCards.length === 0) {
            m.react('❌')
            return m.reply(`❌ Tidak bisa memuat gambar untuk: ${query}`)
        }
        
        const msg = await generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: `🔍 *ᴘɪɴᴛᴇʀᴇsᴛ sᴇᴀʀᴄʜ*\n\n` +
                                `╭┈┈⬡「 📋 *ʜᴀsɪʟ* 」\n` +
                                `┃ 🔎 ǫᴜᴇʀʏ: *${query}*\n` +
                                `┃ 📊 ᴅɪᴛᴇᴍᴜᴋᴀɴ: *${carouselCards.length}* gambar\n` +
                                `╰┈┈⬡\n\n` +
                                `> Geser untuk melihat hasil`
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `${botConfig.bot?.name || 'Ourin'} • Pinterest Search`
                        }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            cards: carouselCards
                        })
                    })
                }
            }
        }, {})
        
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
