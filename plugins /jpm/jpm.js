const { getDatabase } = require('../../src/lib/database')
const { getGroupMode } = require('../group/botmode')
const { config } = require('../../config')
const fs = require('fs')

let cachedThumb = null
try {
    if (fs.existsSync('./assets/images/ourin2.jpg')) {
        cachedThumb = fs.readFileSync('./assets/images/ourin2.jpg')
    }
} catch (e) {}

const pluginConfig = {
    name: 'jpm',
    alias: ['jasher', 'jaser'],
    category: 'jpm',
    description: 'Kirim pesan ke semua grup (JPM)',
    usage: '.jpm <pesan>',
    example: '.jpm Halo semuanya!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (m.isGroup) {
        const groupMode = getGroupMode(m.chat, db)
        if (groupMode !== 'md') {
            return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> JPM hanya tersedia di mode MD\n\n\`${m.prefix}botmode md\``)
        }
    }
    
    const text = m.fullArgs?.trim() || m.text?.trim()
    if (!text) {
        return m.reply(`📢 *ᴊᴘᴍ (ᴊᴀsᴀ ᴘᴇsᴀɴ ᴍᴀssᴀʟ)*\n\n> Masukkan pesan yang ingin dikirim ke semua grup\n\n\`Contoh: ${m.prefix}jpm Halo semuanya!\`\n\n> Bisa juga dengan gambar (reply gambar)`)
    }
    
    if (global.statusjpm) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> JPM sedang berjalan. Ketik \`${m.prefix}stopjpm\` untuk menghentikan.`)
    }
    
    m.react('📢')
    
    try {
        let mediaBuffer = null
        const qmsg = m.quoted || m
        
        if (qmsg.isImage || qmsg.isVideo) {
            try {
                mediaBuffer = await qmsg.download()
            } catch (e) {}
        }
        
        global.isFetchingGroups = true
        const allGroups = await sock.groupFetchAllParticipating()
        global.isFetchingGroups = false
        let groupIds = Object.keys(allGroups)
        
        const blacklist = db.setting('jpmBlacklist') || []
        const blacklistedCount = groupIds.filter(id => blacklist.includes(id)).length
        groupIds = groupIds.filter(id => !blacklist.includes(id))
        
        if (groupIds.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada grup yang ditemukan${blacklistedCount > 0 ? ` (${blacklistedCount} grup di-blacklist)` : ''}`)
        }
        
        const jedaJpm = db.setting('jedaJpm') || 5000
        
        await m.reply(
            `📢 *ᴊᴘᴍ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
            `┃ 📷 ᴍᴇᴅɪᴀ: \`${mediaBuffer ? 'Ya' : 'Tidak'}\`\n` +
            `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${groupIds.length}\` grup\n` +
            `┃ ⏱️ ᴊᴇᴅᴀ: \`${jedaJpm}ms\`\n` +
            `┃ 📊 ᴇsᴛɪᴍᴀsɪ: \`${Math.ceil((groupIds.length * jedaJpm) / 60000)} menit\`\n` +
            `╰┈┈⬡\n\n` +
            `> Memulai JPM ke semua grup...`
        )
        
        global.statusjpm = true
        let successCount = 0
        let failedCount = 0
        
        for (const groupId of groupIds) {
            if (global.stopjpm) {
                delete global.stopjpm
                delete global.statusjpm
                
                await m.reply(
                    `⏹️ *ᴊᴘᴍ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                    `> ✅ Berhasil: \`${successCount}\`\n` +
                    `> ❌ Gagal: \`${failedCount}\`\n` +
                    `> ⏸️ Sisa: \`${groupIds.length - successCount - failedCount}\``
                )
                return
            }
            
            try {
                if (mediaBuffer) {
                    await sock.sendMessage(groupId, {
                        image: mediaBuffer,
                        caption: text,
                        contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id,
                                newsletterName: config.saluran?.name,
                                serverMessageId: 127
                            },
                            externalAdReply: cachedThumb ? {
                                title: config.bot?.name || 'Ourin',
                                body: 'the best bot WA',
                                thumbnail: cachedThumb,
                                sourceUrl: config.saluran?.link || '',
                                mediaType: 1,
                                renderLargerThumbnail: false
                            } : undefined
                        }
                    })
                } else {
                    await sock.sendMessage(groupId, { text: text, contextInfo: {
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id,
                                newsletterName: config.saluran?.name,
                                serverMessageId: 127
                            },
                            externalAdReply: cachedThumb ? {
                                title: config.bot?.name || 'Ourin',
                                body: 'Ourin the best bot WA',
                                thumbnail: cachedThumb,
                                sourceUrl: config.saluran?.link || '',
                                mediaType: 1,
                                renderLargerThumbnail: false
                            } : undefined
                        } })
                }
                successCount++
            } catch (err) {
                failedCount++
            }
            
            await new Promise(resolve => setTimeout(resolve, jedaJpm))
        }
        
        delete global.statusjpm
        
        m.react('✅')
        await m.reply(
            `✅ *ᴊᴘᴍ sᴇʟᴇsᴀɪ*\n\n` +
            `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
            `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
            `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ: \`${groupIds.length}\`\n` +
            `╰┈┈⬡`
        )
        
    } catch (error) {
        delete global.statusjpm
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
