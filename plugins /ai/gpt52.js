const gpt52 = require('../../src/scraper/gpt52')
const config = require('../../config')

const pluginConfig = {
    name: 'gpt52',
    alias: ['gpt5', 'ai5', 'openai5'],
    category: 'ai',
    description: 'Chat dengan GPT-5.2 AI model',
    usage: '.gpt52 <pertanyaan>',
    example: '.gpt52 apa itu javascript?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🧠 *ɢᴘᴛ-𝟻.𝟸*\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}gpt52 apa itu javascript?\``
        )
    }
    
    m.react('🧠')
    
    try {
        await sock.sendPresenceUpdate('composing', m.chat)
        
        const response = await gpt52(text)
        
        if (!response) {
            throw new Error('Tidak ada response dari GPT-5.2')
        }
        
        const formattedResponse = response.replace(/\*\*(.+?)\*\*/g, '*$1*')
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            text: `🧠 *ɢᴘᴛ-𝟻.𝟸*\n\n${formattedResponse}`,
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
        
        await sock.sendPresenceUpdate('paused', m.chat)
        m.react('✅')
        
    } catch (err) {
        console.error('[GPT52] Error:', err)
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message || err}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
