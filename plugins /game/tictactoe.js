const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'tictactoe',
    alias: ['ttt', 'xo'],
    category: 'game',
    description: 'Main TicTacToe dengan player lain',
    usage: '.tictactoe [room name] atau .ttt',
    example: '.tictactoe',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

class TicTacToe {
    constructor(playerX = 'x', playerO = 'o') {
        this.playerX = playerX
        this.playerO = playerO
        this._currentTurn = false
        this._x = 0
        this._o = 0
        this.turns = 0
    }

    get board() {
        return this._x | this._o
    }

    get currentTurn() {
        return this._currentTurn ? this.playerO : this.playerX
    }

    get enemyTurn() {
        return this._currentTurn ? this.playerX : this.playerO
    }

    static check(state) {
        for (let combo of [7, 56, 73, 84, 146, 273, 292, 448])
            if ((state & combo) === combo)
                return true
        return false
    }

    static toBinary(x = 0, y = 0) {
        if (x < 0 || x > 2 || y < 0 || y > 2) throw new Error('invalid position')
        return 1 << x + (3 * y)
    }

    turn(player = 0, x = 0, y) {
        if (this.board === 511) return -3
        let pos = 0
        if (y == null) {
            if (x < 0 || x > 8) return -1
            pos = 1 << x
        } else {
            if (x < 0 || x > 2 || y < 0 || y > 2) return -1
            pos = TicTacToe.toBinary(x, y)
        }
        if (this._currentTurn ^ player) return -2
        if (this.board & pos) return 0
        this[this._currentTurn ? '_o' : '_x'] |= pos
        this._currentTurn = !this._currentTurn
        this.turns++
        return 1
    }

    static render(boardX = 0, boardO = 0) {
        let x = parseInt(boardX.toString(2), 4)
        let y = parseInt(boardO.toString(2), 4) * 2
        return [...(x + y).toString(4).padStart(9, '0')].reverse().map((value, index) => value == 1 ? 'X' : value == 2 ? 'O' : ++index)
    }
    
    render() {
        return TicTacToe.render(this._x, this._o)
    }

    get winner() {
        let x = TicTacToe.check(this._x)
        let o = TicTacToe.check(this._o)
        return x ? this.playerX : o ? this.playerO : false
    }
}

if (!global.tictactoeGames) global.tictactoeGames = {}
async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const roomName = args.join(' ').trim()
    
    // Check if player already in a game
    const existingRoom = Object.values(global.tictactoeGames).find(
        room => room.id.startsWith('ttt_') && 
        [room.game.playerX, room.game.playerO].includes(m.sender)
    )
    
    if (existingRoom) {
        return m.reply(
            `❌ Kamu masih dalam game!\n\n` +
            `> Selesaikan game kamu atau ketik *nyerah* untuk menyerah.`
        )
    }
    
    // Find waiting room or create new
    let room = Object.values(global.tictactoeGames).find(
        r => r.state === 'WAITING' && r.chat === m.chat && (roomName ? r.name === roomName : true)
    )
    
    if (room) {
        // Join existing room
        room.game.playerO = m.sender
        room.state = 'PLAYING'
        
        const board = renderBoard(room.game.render())
        
        const txt = `🎮 *ᴛɪᴄ ᴛᴀᴄ ᴛᴏᴇ*\n\n` +
            `Partner ditemukan!\n\n` +
            `❌ @${room.game.playerX.split('@')[0]}\n` +
            `⭕ @${room.game.playerO.split('@')[0]}\n\n` +
            `${board}\n\n` +
            `> Giliran: @${room.game.currentTurn.split('@')[0]}\n` +
            `> Reply pesan ini dengan angka 1-9\n` +
            `> Ketik *nyerah* untuk menyerah`
        
        await m.react('🎮')
        await m.reply(txt, { mentions: [room.game.playerX, room.game.playerO] })
        
    } else {
        // Create new room
        const roomId = 'ttt_' + Date.now()
        
        global.tictactoeGames[roomId] = {
            id: roomId,
            chat: m.chat,
            name: roomName || null,
            game: new TicTacToe(m.sender, 'o'),
            state: 'WAITING',
            createdAt: Date.now()
        }
        
        await m.react('⏳')
        await m.reply(
            `🎮 *ᴛɪᴄ ᴛᴀᴄ ᴛᴏᴇ*\n\n` +
            `Room dibuat! Menunggu partner...\n\n` +
            `> Ketik \`.tictactoe${roomName ? ' ' + roomName : ''}\` untuk join\n` +
            `> Room akan expired dalam 5 menit`
        )
        
        // Auto delete after 5 min
        setTimeout(() => {
            if (global.tictactoeGames[roomId]?.state === 'WAITING') {
                delete global.tictactoeGames[roomId]
            }
        }, 300000)
    }
}

// ==================== Answer Handler ====================
async function answerHandler(m, sock) {
    if (!m.body) return false
    
    const text = m.body.trim().toLowerCase()
    
    // Find player's active game
    const room = Object.values(global.tictactoeGames).find(
        r => r.state === 'PLAYING' && 
        r.chat === m.chat &&
        [r.game.playerX, r.game.playerO].includes(m.sender)
    )
    
    if (!room) return false
    
    const db = getDatabase()
    
    // Handle surrender
    if (text === 'nyerah' || text === 'surrender' || text === 'give up') {
        const winner = m.sender === room.game.playerX ? room.game.playerO : room.game.playerX
        const loser = m.sender
        
        // Reward winner
        const winnerData = db.getUser(winner) || {}
        winnerData.balance = (winnerData.balance || 0) + 500
        db.setUser(winner, winnerData)
        
        await m.react('🏳️')
        await m.reply(
            `🏳️ *MENYERAH!*\n\n` +
            `@${loser.split('@')[0]} menyerah!\n` +
            `@${winner.split('@')[0]} menang! +Rp 500`,
            { mentions: [winner, loser] }
        )
        
        delete global.tictactoeGames[room.id]
        return true
    }
    
    // Check if valid move
    const move = parseInt(text)
    if (isNaN(move) || move < 1 || move > 9) return false
    
    // Check if it's player's turn
    if (room.game.currentTurn !== m.sender) {
        await m.reply('❌ Bukan giliranmu!')
        return true
    }
    
    // Make move
    const player = room.game.playerX === m.sender ? 0 : 1
    const result = room.game.turn(player, move - 1)
    
    if (result === 0) {
        await m.reply('❌ Posisi sudah terisi!')
        return true
    }
    
    if (result === -1) {
        await m.reply('❌ Posisi tidak valid!')
        return true
    }
    
    const board = renderBoard(room.game.render())
    const winner = room.game.winner
    const isTie = room.game.board === 511 && !winner
    
    if (winner) {
        const loser = winner === room.game.playerX ? room.game.playerO : room.game.playerX
        
        // Reward winner
        const winnerData = db.getUser(winner) || {}
        winnerData.balance = (winnerData.balance || 0) + 1000
        db.setUser(winner, winnerData)
        
        await m.react('🎉')
        await m.reply(
            `🎉 *GAME OVER!*\n\n` +
            `${board}\n\n` +
            `🏆 @${winner.split('@')[0]} menang! +Rp 1.000`,
            { mentions: [winner, loser] }
        )
        
        delete global.tictactoeGames[room.id]
        return true
    }
    
    if (isTie) {
        await m.react('🤝')
        await m.reply(
            `🤝 *SERI!*\n\n` +
            `${board}\n\n` +
            `> Tidak ada pemenang!`,
            { mentions: [room.game.playerX, room.game.playerO] }
        )
        
        delete global.tictactoeGames[room.id]
        return true
    }
    
    // Continue game
    await m.react('✅')
    await m.reply(
        `🎮 *ᴛɪᴄ ᴛᴀᴄ ᴛᴏᴇ*\n\n` +
        `${board}\n\n` +
        `> Giliran: @${room.game.currentTurn.split('@')[0]}`,
        { mentions: [room.game.currentTurn] }
    )
    
    return true
}

// ==================== Helper ====================
function renderBoard(arr) {
    return `┌───┬───┬───┐
│ ${arr[0]} │ ${arr[1]} │ ${arr[2]} │
├───┼───┼───┤
│ ${arr[3]} │ ${arr[4]} │ ${arr[5]} │
├───┼───┼───┤
│ ${arr[6]} │ ${arr[7]} │ ${arr[8]} │
└───┴───┴───┘`.replace(/X/g, '❌').replace(/O/g, '⭕')
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
