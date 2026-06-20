const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ttsearch',
    alias: ['tiktoksearch', 'tts', 'searchtiktok'],
    category: 'search',
    description: 'Cari video TikTok',
    usage: '.ttsearch <query>',
    example: '.ttsearch jj epep',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
}

async function tiktokSearchVideo(query) {
    try {
        const res = await axios.post('https://tikwm.com/api/feed/search', {
            keywords: query,
            count: 12,
            cursor: 0,
            web: 1,
            hd: 1
        }, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'cookie': 'current_language=en',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            },
            timeout: 30000
        })
        
        return res.data?.data || null
    } catch (e) {
        return null
    }
}

async function handler(m, { sock }) {
    const query = m.args.join(' ')?.trim()
    
    if (!query) {
        return m.reply(
            `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ sᴇᴀʀᴄʜ* 」
┃
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}ttsearch <query>\`
┃
╰┈┈⬡

> \`Contoh: ${m.prefix}ttsearch jj epep\``
        )
    }
    
    m.react('🔍')
    
    try {
        const search = await tiktokSearchVideo(query)
        
        if (!search || !search.videos || search.videos.length === 0) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan video untuk: ${query}`)
        }
        
        const video = search.videos[0]
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            video: { url: `https://tikwm.com${video.play}` },
            mimetype: 'video/mp4',
            caption: `╭┈┈⬡「 🎵 *ᴛɪᴋᴛᴏᴋ sᴇᴀʀᴄʜ* 」
┃
┃ 🎬 *${video.title?.substring(0, 50) || 'No Title'}*
┃
┃ ㊗ ᴠɪᴅᴇᴏ ɪᴅ: \`${video.video_id}\`
┃ ㊗ ᴜsᴇʀɴᴀᴍᴇ: @${video.author?.unique_id || '-'}
┃ ㊗ ɴɪᴄᴋɴᴀᴍᴇ: ${video.author?.nickname || '-'}
┃ ㊗ ᴅᴜʀᴀsɪ: ${video.duration || 0} detik
┃
╰┈┈⬡

╭┈┈⬡「 📊 *sᴛᴀᴛs* 」
┃ ❤️ ʟɪᴋᴇ: ${video.digg_count?.toLocaleString() || 0}
┃ 💬 ᴄᴏᴍᴍᴇɴᴛ: ${video.comment_count?.toLocaleString() || 0}
┃ 🔗 sʜᴀʀᴇ: ${video.share_count?.toLocaleString() || 0}
╰┈┈⬡

> 🔗 https://tiktok.com/@${video.author?.unique_id}/video/${video.video_id}`,
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
        
        if (search.videos.length > 1) {
            let list = ''
            const maxShow = Math.min(search.videos.length, 5)
            
            for (let i = 1; i < maxShow; i++) {
                const v = search.videos[i]
                list += `┃ ${i}. 🎵 *${v.title?.substring(0, 30) || 'No Title'}*\n`
                list += `┃   ⏱️ ${v.duration}s | ❤️ ${v.digg_count?.toLocaleString() || 0}\n`
                list += `┃   🔗 tiktok.com/@${v.author?.unique_id}/video/${v.video_id}\n┃\n`
            }
            
            await sock.sendMessage(m.chat, {
                text: `╭┈┈⬡「 📚 *ᴠɪᴅᴇᴏ ʟᴀɪɴɴʏᴀ* 」
┃
${list}╰┈┈⬡`,
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
        }
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    tiktokSearchVideo
}
