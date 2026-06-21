const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const { createGoodbyeCard } = require('../../src/lib/welcomeCard')
const { resolveAnyLidToJid } = require('../../src/lib/lidHelper')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'goodbye',
    alias: ['bye', 'leave'],
    category: 'group',
    description: 'Mengatur goodbye message untuk grup',
    usage: '.goodbye <on/off>',
    example: '.goodbye on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

function buildGoodbyeMessage(participant, groupName, memberCount, customMsg = null) {
    const farewells = [
        `Sayonara`, `Selamat tinggal`, `Bye bye`, `Dadah`, 
        `Take care`, `See you`, `Sampai jumpa`
    ]
    const quotes = [
        `Semoga sukses di mana pun kamu berada!`,
        `Pintu selalu terbuka kalau mau balik!`,
        `Jangan lupa sama kita ya...`,
        `Mudah-mudahan kita ketemu lagi!`,
        `Good luck buat semuanya!`,
        `Kita bakal kangen sama kamu!`
    ]
    const emojis = ['👋', '💔', '😢', '🥺', '💫', '🌙']
    const farewell = farewells[Math.floor(Math.random() * farewells.length)]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    
    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${participant?.split('@')[0] || 'User'}`)
            .replace(/{group}/gi, groupName || 'Grup')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }
    
    return `╔══════════════════╗
       *G O O D B Y E*
╚══════════════════╝

${emoji} ${farewell}, @${participant?.split('@')[0]}!

╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」
┃ 🏠 *Grup:* ${groupName}
┃ 👥 *Sisa Member:* ${memberCount}
┃ 📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID')}
╰┈┈⬡

💌 *Pesan:* ${quote}

> _Sampai jumpa lagi suatu saat nanti... 🌈_`
}

async function sendGoodbyeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.goodbye !== true && groupData?.leave !== true) return false

        const { cacheParticipantLids, getCachedJid, isLid, isLidConverted, lidToJid } = require('../../src/lib/lidHelper')
        
        if (groupMeta?.participants) {
            cacheParticipantLids(groupMeta.participants)
        }
        
        let realParticipant = participant
        
        const cachedJid = getCachedJid(participant)
        if (cachedJid && !isLidConverted(cachedJid)) {
            realParticipant = cachedJid
        } else if (isLid(participant)) {
            const lidFormat = participant
            const cachedFromLid = getCachedJid(lidFormat)
            if (cachedFromLid && !isLidConverted(cachedFromLid)) {
                realParticipant = cachedFromLid
            } else {
                realParticipant = lidToJid(participant)
            }
        } else if (isLidConverted(participant)) {
            const lidNumber = participant.replace('@s.whatsapp.net', '')
            const lidFormat = lidNumber + '@lid'
            const cachedFromLid = getCachedJid(lidFormat)
            if (cachedFromLid && !isLidConverted(cachedFromLid)) {
                realParticipant = cachedFromLid
            }
        }
        
        const memberCount = groupMeta?.participants?.length || 0
        const groupName = groupMeta?.subject || 'Grup'
        
        let userName = realParticipant?.split('@')[0] || 'User'
        try {
            const pushName = await sock.getName(realParticipant)
            if (pushName && pushName.trim()) userName = pushName
        } catch {}
        
        const fallbackPP = path.join(process.cwd(), 'assets', 'images', 'pp-kosong.jpg')
        let ppUrl = fs.existsSync(fallbackPP) ? fallbackPP : 'https://i.imgur.com/TuItj4L.png'
        try {
            ppUrl = await sock.profilePictureUrl(realParticipant, 'image') || ppUrl
        } catch {}

        let canvasBuffer = null
        try {
            canvasBuffer = await createGoodbyeCard('GOODBYE', userName, ppUrl, memberCount.toLocaleString())
        } catch (e) {
            console.error('Goodbye Canvas Error:', e.message)
        }

        const text = buildGoodbyeMessage(
            realParticipant,
            groupMeta?.subject,
            memberCount,
            groupData?.goodbyeMsg
        )

        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

        await sock.sendMessage(groupJid, {
            text,
            mentions: [realParticipant],
            contextInfo: {
                mentionedJid: [realParticipant],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                },
                externalAdReply: {
                    sourceUrl: config.info?.website || 'https://sc.ourin.my.id/',
                    mediaType: 1,
                    thumbnail: canvasBuffer,
                    title: `Goodbye ${userName}`,
                    body: `${memberCount} members remaining`,
                    renderLargerThumbnail: true
                }
            }
        })
        
        return true
    } catch (error) {
        console.error('Goodbye Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}
    const currentStatus = groupData.goodbye === true
    
    if (sub === 'on' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Hanya owner yang bisa menggunakan fitur ini!`)
        }
        
        m.react('⏳')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { goodbye: true, leave: true })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `✅ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `> Goodbye diaktifkan di *${count}* grup!`
            )
        } catch (err) {
            m.react('❌')
            return m.reply(`❌ Error: ${err.message}`)
        }
    }
    
    if (sub === 'off' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Hanya owner yang bisa menggunakan fitur ini!`)
        }
        
        m.react('⏳')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { goodbye: false, leave: false })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `❌ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `> Goodbye dinonaktifkan di *${count}* grup!`
            )
        } catch (err) {
            m.react('❌')
            return m.reply(`❌ Error: ${err.message}`)
        }
    }
    
    if (sub === 'on') {
        if (currentStatus) {
            return m.reply(
                `⚠️ *ɢᴏᴏᴅʙʏᴇ ᴀʟʀᴇᴀᴅʏ ᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *✅ ON*\n` +
                `> Goodbye sudah aktif di grup ini.\n\n` +
                `_Gunakan \`${m.prefix}goodbye off\` untuk menonaktifkan._`
            )
        }
        db.setGroup(m.chat, { goodbye: true, leave: true })
        return m.reply(
            `✅ *ɢᴏᴏᴅʙʏᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Goodbye message berhasil diaktifkan!\n` +
            `> Member yang keluar akan diberi pesan.\n\n` +
            `_Gunakan \`${m.prefix}setgoodbye\` untuk custom pesan._`
        )
    }
    
    if (sub === 'off') {
        if (!currentStatus) {
            return m.reply(
                `⚠️ *ɢᴏᴏᴅʙʏᴇ ᴀʟʀᴇᴀᴅʏ ɪɴᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *❌ OFF*\n` +
                `> Goodbye sudah nonaktif di grup ini.\n\n` +
                `_Gunakan \`${m.prefix}goodbye on\` untuk mengaktifkan._`
            )
        }
        db.setGroup(m.chat, { goodbye: false, leave: false })
        return m.reply(
            `❌ *ɢᴏᴏᴅʙʏᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Goodbye message berhasil dinonaktifkan.\n` +
            `> Member yang keluar tidak akan diberi pesan.`
        )
    }
    
    m.reply(
        `👋 *ɢᴏᴏᴅʙʏᴇ sᴇᴛᴛɪɴɢs*\n\n` +
        `> Status: *${currentStatus ? '✅ ON' : '❌ OFF'}*\n\n` +
        `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
        `> \`${m.prefix}goodbye on\` → Aktifkan\n` +
        `> \`${m.prefix}goodbye off\` → Nonaktifkan\n` +
        `> \`${m.prefix}goodbye on all\` → Global ON (owner)\n` +
        `> \`${m.prefix}goodbye off all\` → Global OFF (owner)\n` +
        `> \`${m.prefix}setgoodbye\` → Custom pesan\n` +
        `> \`${m.prefix}resetgoodbye\` → Reset default`
    )
}

module.exports = {
    config: pluginConfig,
    handler,
    sendGoodbyeMessage
}
