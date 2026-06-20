const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addprem',
    alias: ['addpremium', 'setprem'],
    category: 'owner',
    description: 'Menambahkan user ke daftar premium',
    usage: '.addprem <nomor/@tag>',
    example: '.addprem 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`💎 *ᴀᴅᴅ ᴘʀᴇᴍɪᴜᴍ*\n\n> Masukkan nomor atau tag user\n\n\`Contoh: ${m.prefix}addprem 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (!config.premiumUsers) config.premiumUsers = []
    
    if (config.premiumUsers.includes(targetNumber)) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` sudah premium`)
    }
    
    config.premiumUsers.push(targetNumber)
    db.setting('premiumUsers', config.premiumUsers)
    
    m.react('💎')
    
    await m.reply(
        `💎 *ᴘʀᴇᴍɪᴜᴍ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNumber}\`\n` +
        `┃ 💎 sᴛᴀᴛᴜs: \`Premium\`\n` +
        `┃ 📊 ᴛᴏᴛᴀʟ: \`${config.premiumUsers.length}\` ᴜsᴇʀ\n` +
        `╰┈┈⬡\n\n` +
        `> _Premium ini akan tetap tersimpan meski bot restart_`
    )
}

function loadPremium() {
    try {
        const { getDatabase } = require('../../src/lib/database')
        const db = getDatabase()
        if (!db || !db.db || !db.db.data) {
            setTimeout(loadPremium, 2000)
            return
        }
        
        const savedPremium = db.setting('premiumUsers') || []
        if (savedPremium.length > 0) {
            if (!config.premiumUsers) config.premiumUsers = []
            for (const prem of savedPremium) {
                if (!config.premiumUsers.includes(prem)) {
                    config.premiumUsers.push(prem)
                }
            }
            console.log(`[AddPrem] Loaded ${savedPremium.length} premium users into config.premiumUsers`)
        }
    } catch (e) {
        setTimeout(loadPremium, 2000)
    }
}

setTimeout(loadPremium, 3000)

module.exports = {
    config: pluginConfig,
    handler,
    loadPremium
}
