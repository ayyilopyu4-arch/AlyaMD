/**
 * Suit PvP - Rock Paper Scissors PvP Game
 * Ported from RTXZY-MD-pro with integrated answer handler
 * 100% self-contained
 */

const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'suitpvp',
    alias: ['suit', 'rps', 'janken'],
    category: 'game',
    description: 'Main suit (batu gunting kertas) dengan player lain',
    usage: '.suit @tag',
    example: '.suit @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    limit: 0,
    isEnabled: true
}

// Session storage
if (!global.suitGames) global.suitGames = {}

const TIMEOUT = 60000
const WIN_REWARD = 1000
const LOSE_PENALTY = 500

// ==================== Handler ====================
async function handler(m, { sock }) {
    const db = getDatabase()
    
    // Check if player already in a game
    const existingRoom = Object.values(global.suitGames).find(
        room => [room.p, room.p2].includes(m.sender)
    )
    
    if (existingRoom) {
        return m.reply(
            `❌ Kamu masih dalam game suit!\n\n` +
            `> Selesaikan game kamu dulu.`
        )
    }
    
    // Get target
    let target = null
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        target = m.mentionedJid[0]
    }
    
    if (!target) {
        return m.reply(
            `✊✌️✋ *sᴜɪᴛ ᴘᴠᴘ*\n\n` +
            `> Tag orang yang mau kamu tantang!\n\n` +
            `*Contoh:*\n` +
            `> \`.suit @628xxx\``
        )
    }
    
    if (target === m.sender) {
        return m.reply('❌ Tidak bisa menantang diri sendiri!')
    }
    
    // Check if target already in game
    const targetInGame = Object.values(global.suitGames).find(
        room => [room.p, room.p2].includes(target)
    )
    
    if (targetInGame) {
        return m.reply('❌ Orang itu sedang bermain suit dengan orang lain!')
    }
    
    // Create room
    const roomId = 'suit_' + Date.now()
    
    global.suitGames[roomId] = {
        id: roomId,
        chat: m.chat,
        p: m.sender,
        p2: target,
        status: 'waiting',
        pilih: null,
        pilih2: null,
        createdAt: Date.now(),
        timeout: setTimeout(() => {
            if (global.suitGames[roomId]) {
                sock.sendMessage(m.chat, {
                    text: `⏱️ *TIMEOUT!*\n\n@${target.split('@')[0]} tidak merespon!\nSuit dibatalkan.`,
                    mentions: [target]
                })
                delete global.suitGames[roomId]
            }
        }, TIMEOUT)
    }
    
    await m.react('✊')
    await m.reply(
        `✊✌️✋ *sᴜɪᴛ ᴘᴠᴘ*\n\n` +
        `@${m.sender.split('@')[0]} menantang @${target.split('@')[0]}!\n\n` +
        `╭┈┈⬡「 💬 *ʀᴇsᴘᴏɴ* 」\n` +
        `┃ ✅ Ketik *terima* / *gas* / *ok*\n` +
        `┃ ❌ Ketik *tolak* / *gabisa*\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> Timeout: 60 detik`,
        { mentions: [m.sender, target] }
    )
}

// ==================== Answer Handler ====================
async function answerHandler(m, sock) {
    if (!m.body) return false
    
    const text = m.body.trim().toLowerCase()
    const db = getDatabase()
    
    // Find player's room
    const room = Object.values(global.suitGames).find(
        r => r.chat === m.chat && [r.p, r.p2].includes(m.sender)
    )
    
    if (!room) return false
    
    // ==================== WAITING PHASE ====================
    if (room.status === 'waiting' && m.sender === room.p2) {
        // Accept challenge
        if (/^(acc(ept)?|terima|gas|oke?|ok|iya|yoi)$/i.test(text)) {
            clearTimeout(room.timeout)
            room.status = 'playing'
            
            await m.react('🎮')
            await sock.sendMessage(m.chat, {
                text: `✊✌️✋ *sᴜɪᴛ ᴅɪᴍᴜʟᴀɪ!*\n\n` +
                    `@${room.p.split('@')[0]} vs @${room.p2.split('@')[0]}\n\n` +
                    `> Ketik *batu*, *gunting*, atau *kertas* di chat ini!\n` +
                    `> Timeout: 60 detik`,
                mentions: [room.p, room.p2]
            })
            
            // Set play timeout
            room.timeout = setTimeout(async () => {
                if (global.suitGames[room.id]) {
                    if (!room.pilih && !room.pilih2) {
                        await sock.sendMessage(m.chat, { 
                            text: '⏱️ Kedua pemain tidak memilih, suit dibatalkan!' 
                        })
                    } else if (!room.pilih || !room.pilih2) {
                        const afk = !room.pilih ? room.p : room.p2
                        const winner = !room.pilih ? room.p2 : room.p
                        
                        // Reward winner
                        const winnerData = db.getUser(winner) || {}
                        winnerData.balance = (winnerData.balance || 0) + WIN_REWARD
                        db.setUser(winner, winnerData)
                        
                        await sock.sendMessage(m.chat, {
                            text: `⏱️ *TIMEOUT!*\n\n` +
                                `@${afk.split('@')[0]} tidak memilih!\n` +
                                `@${winner.split('@')[0]} menang! +Rp ${WIN_REWARD.toLocaleString()}`,
                            mentions: [afk, winner]
                        })
                    }
                    delete global.suitGames[room.id]
                }
            }, TIMEOUT)
            
            return true
        }
        
        // Reject challenge
        if (/^(tolak|gamau|nanti|ga(k.)?bisa|no|tidak)$/i.test(text)) {
            clearTimeout(room.timeout)
            
            await sock.sendMessage(m.chat, {
                text: `❌ @${room.p2.split('@')[0]} menolak tantangan!\nSuit dibatalkan.`,
                mentions: [room.p2]
            })
            
            delete global.suitGames[room.id]
            return true
        }
    }
    
    // ==================== PLAYING PHASE ====================
    if (room.status === 'playing') {
        const choices = /^(batu|gunting|kertas)$/i
        
        if (!choices.test(text)) return false
        
        const choice = text.toLowerCase()
        
        // Player 1 picks
        if (m.sender === room.p && !room.pilih) {
            room.pilih = choice
            await m.react('✅')
            await m.reply(`Kamu memilih *${choice}*!\n> Menunggu lawan...`)
            
            if (!room.pilih2) {
                await sock.sendMessage(m.chat, {
                    text: `⏳ @${room.p.split('@')[0]} sudah memilih!\n> @${room.p2.split('@')[0]} giliran kamu!`,
                    mentions: [room.p, room.p2]
                })
            }
        }
        
        // Player 2 picks
        if (m.sender === room.p2 && !room.pilih2) {
            room.pilih2 = choice
            await m.react('✅')
            await m.reply(`Kamu memilih *${choice}*!\n> Menunggu lawan...`)
            
            if (!room.pilih) {
                await sock.sendMessage(m.chat, {
                    text: `⏳ @${room.p2.split('@')[0]} sudah memilih!\n> @${room.p.split('@')[0]} giliran kamu!`,
                    mentions: [room.p, room.p2]
                })
            }
        }
        
        // Both picked - determine winner
        if (room.pilih && room.pilih2) {
            clearTimeout(room.timeout)
            
            let winner = null
            let tie = false
            
            if (room.pilih === room.pilih2) {
                tie = true
            } else if (
                (room.pilih === 'batu' && room.pilih2 === 'gunting') ||
                (room.pilih === 'gunting' && room.pilih2 === 'kertas') ||
                (room.pilih === 'kertas' && room.pilih2 === 'batu')
            ) {
                winner = room.p
            } else {
                winner = room.p2
            }
            
            const emoji = {
                batu: '✊',
                gunting: '✌️',
                kertas: '✋'
            }
            
            let resultTxt = `✊✌️✋ *ʜᴀsɪʟ sᴜɪᴛ*\n\n`
            resultTxt += `@${room.p.split('@')[0]} ${emoji[room.pilih]} ${room.pilih}\n`
            resultTxt += `@${room.p2.split('@')[0]} ${emoji[room.pilih2]} ${room.pilih2}\n\n`
            
            if (tie) {
                resultTxt += `🤝 *SERI!*`
                await m.react('🤝')
            } else {
                const loser = winner === room.p ? room.p2 : room.p
                
                // Update balances
                const winnerData = db.getUser(winner) || {}
                winnerData.balance = (winnerData.balance || 0) + WIN_REWARD
                db.setUser(winner, winnerData)
                
                resultTxt += `🏆 @${winner.split('@')[0]} menang!\n`
                resultTxt += `> +Rp ${WIN_REWARD.toLocaleString()}`
                
                await m.react('🎉')
            }
            
            await sock.sendMessage(m.chat, {
                text: resultTxt,
                mentions: [room.p, room.p2]
            })
            
            delete global.suitGames[room.id]
        }
        
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
