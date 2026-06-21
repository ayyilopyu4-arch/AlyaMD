const axios = require('axios')

const pluginConfig = {
    name: 'bfstock',
    alias: ['bloxfruitstock', 'bfstok'],
    category: 'info',
    description: 'Cek stok buah Blox Fruits',
    usage: '.bfstock',
    example: '.bfstock',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

const EMOJI_MAP = { 
    "Rocket": "🚀", "Spin": "🌪️", "Chop": "⚔️", "Spring": "🌀", 
    "Bomb": "💣", "Smoke": "💨", "Spike": "🌵", "Flame": "🔥", 
    "Falcon": "🦅", "Ice": "❄️", "Sand": "⏳", "Dark": "🌑", 
    "Diamond": "💎", "Light": "💡", "Rubber": "🎈", "Barrier": "🧱", 
    "Ghost": "👻", "Magma": "🌋", "Quake": "💥", "Buddha": "🧘", 
    "Love": "❤️", "Spider": "🕷️", "Sound": "🎵", "Phoenix": "🔥", 
    "Portal": "🌀", "Rumble": "⚡", "Pain": "🐾", "Blizzard": "🌨️", 
    "Gravity": "☄️", "Mammoth": "🐘", "T-Rex": "🦖", "Dough": "🍩", 
    "Shadow": "👤", "Venom": "☠️", "Control": "🕹️", "Spirit": "👻", 
    "Dragon": "🐉", "Leopard": "🐆", "Kitsune": "🦊", "Blade": "⚔️", 
    "Eagle": "🦅", "Creation": "✨" 
}

function formatFruitName(name) {
    if (!name) return 'Unknown'
    const parts = name.split('-')
    if (parts.length === 2 && parts[0] === parts[1]) return parts[0]
    return name.replace(/-/g, ' ')
}

function formatCategory(title, emojiHeader, items) {
    if (!items || items.length === 0) return `*${emojiHeader} ${title}:*\n> Stok tidak tersedia.\n\n`
    
    let text = `${emojiHeader} *${title}*\n`
    text += items.map(item => {
        const name = formatFruitName(item.name)
        const emoji = EMOJI_MAP[name] || '❔'
        const price = item.price ? item.price.toLocaleString('id-ID') : '???'
        return `> ${emoji} ${name} (💲${price})`
    }).join('\n')
    
    return text + '\n\n'
}

async function handler(m, { sock }) {
    m.react('🍓')
    
    try {
        const apiUrl = 'https://www.gamersberg.com/api/blox-fruits/stock'
        const { data } = await axios.get(apiUrl, { timeout: 15000 })
        
        let stockData, lastUpdate
        
        if (data && data.data && data.data.length > 0) {
            stockData = data.data[0]
            lastUpdate = new Date(data.meta.lastUpdateTime * 1000).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
        } else if (data && data.stock) {
            stockData = data.stock
            lastUpdate = new Date(data.stock.updated).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
        } else {
            throw new Error('Format API tidak dikenal atau data kosong.')
        }
        
        const normalStock = stockData.normalStock || stockData.normal || []
        const mirageStock = stockData.mirageStock || stockData.mirage || []
        
        let replyText = `🍓 *sᴛᴏᴋ ʙᴜᴀʜ ʙʟᴏx ғʀᴜɪᴛs*\n`
        replyText += `> Update: ${lastUpdate} WIB\n\n`
        replyText += formatCategory('Normal Stock', '🏪', normalStock)
        replyText += formatCategory('Mirage Stock', '🏝️', mirageStock)
        
        await m.reply(replyText.trim())
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Gagal mengambil data stok Blox Fruits.`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
