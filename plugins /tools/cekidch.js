const pluginConfig = {
    name: 'cekidch',
    alias: ['idch', 'channelid'],
    category: 'tools',
    description: 'Cek ID channel dari link',
    usage: '.cekidch <link channel>',
    example: '.cekidch https://whatsapp.com/channel/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(`📺 *ᴄᴇᴋ ɪᴅ ᴄʜᴀɴɴᴇʟ*\n\n> Masukkan link channel\n\n\`Contoh: ${m.prefix}cekidch https://whatsapp.com/channel/xxxxx\``)
    }
    
    if (!text.includes('https://whatsapp.com/channel/')) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link channel tidak valid`)
    }
    
    m.react('📺')
    
    try {
        const inviteCode = text.split('https://whatsapp.com/channel/')[1]?.split(/[\s?]/)[0]
        
        if (!inviteCode) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengekstrak kode invite`)
        }
        
        const metadata = await sock.newsletterMetadata('invite', inviteCode)
        
        if (!metadata?.id) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Channel tidak ditemukan`)
        }
        
        m.react('✅')
        await m.reply(
            `📺 *ᴄʜᴀɴɴᴇʟ ɪɴꜰᴏ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🆔 ɪᴅ: \`${metadata.id}\`\n` +
            `┃ 📝 ɴᴀᴍᴀ: \`${metadata.name || 'Unknown'}\`\n` +
            `┃ 👥 sᴜʙsᴄʀɪʙᴇʀ: \`${metadata.subscribers || 0}\`\n` +
            `╰┈┈⬡`
        )
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
