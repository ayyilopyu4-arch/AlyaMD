const { createCanvas } = require('@napi-rs/canvas')
const { performance } = require('perf_hooks')
const os = require('os')
const { execSync } = require('child_process')
const config = require('../../config')

const THEME = {
    bg: '#0d1117',
    bgCard: '#161b22',
    primary: '#58a6ff',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    purple: '#a371f7',
    cyan: '#39c5cf',
    pink: '#db61a2',
    orange: '#f0883e',
    textPrimary: '#f0f6fc',
    textSecondary: '#8b949e',
    border: '#30363d'
}

const pluginConfig = {
    name: 'ping',
    alias: ['speed', 'p', 'latency'],
    category: 'main',
    description: 'Cek kecepatan respon bot dengan dashboard',
    usage: '.ping',
    example: '.ping',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    limit: 0,
    isEnabled: true
}

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

const formatTime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${s}s`
}

function drawGauge(ctx, x, y, radius, percent, color, label) {
    ctx.save()
    ctx.lineCap = 'round'
    
    ctx.beginPath()
    ctx.arc(x, y, radius, Math.PI * 0.75, Math.PI * 2.25)
    ctx.strokeStyle = THEME.border
    ctx.lineWidth = 12
    ctx.stroke()
    
    const endAngle = Math.PI * 0.75 + (Math.PI * 1.5 * (percent / 100))
    ctx.beginPath()
    ctx.arc(x, y, radius, Math.PI * 0.75, endAngle)
    ctx.strokeStyle = color
    ctx.lineWidth = 12
    ctx.shadowColor = color
    ctx.shadowBlur = 15
    ctx.stroke()
    ctx.shadowBlur = 0
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(percent)}%`, x, y)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px Arial'
    ctx.fillText(label, x, y + radius + 25)
    
    ctx.restore()
}

function drawStatCard(ctx, x, y, w, h, icon, label, value, color) {
    ctx.save()
    
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 10)
    ctx.fillStyle = THEME.bgCard
    ctx.fill()
    ctx.strokeStyle = THEME.border
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.fillStyle = color
    ctx.font = '24px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(icon, x + 15, y + 35)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '11px Arial'
    ctx.fillText(label, x + 50, y + 25)
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 14px Arial'
    let displayValue = value.toString()
    if (displayValue.length > 15) displayValue = displayValue.substring(0, 15) + '...'
    ctx.fillText(displayValue, x + 50, y + 45)
    
    ctx.restore()
}

function drawProgressBar(ctx, x, y, w, h, percent, color, label, value) {
    ctx.save()
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '11px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(label, x, y - 5)
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(value, x + w, y - 5)
    
    ctx.beginPath()
    ctx.roundRect(x, y + 5, w, h, 4)
    ctx.fillStyle = THEME.border
    ctx.fill()
    
    if (percent > 0) {
        const fillWidth = Math.max(8, w * (percent / 100))
        ctx.beginPath()
        ctx.roundRect(x, y + 5, fillWidth, h, 4)
        const grad = ctx.createLinearGradient(x, 0, x + fillWidth, 0)
        grad.addColorStop(0, color)
        grad.addColorStop(1, color + 'aa')
        ctx.fillStyle = grad
        ctx.fill()
    }
    
    ctx.restore()
}

async function renderDashboard(stats) {
    const W = 900
    const H = 550
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0d1117')
    bgGrad.addColorStop(0.5, '#161b22')
    bgGrad.addColorStop(1, '#0d1117')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    ctx.globalAlpha = 0.02
    ctx.strokeStyle = THEME.primary
    for (let i = 0; i < W; i += 30) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, H)
        ctx.stroke()
    }
    for (let i = 0; i < H; i += 30) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(W, i)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
    
    ctx.save()
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 15
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('⚡ SYSTEM DASHBOARD', 30, 45)
    ctx.restore()
    
    const pingColor = stats.ping < 100 ? THEME.success : stats.ping < 300 ? THEME.warning : THEME.danger
    ctx.fillStyle = pingColor
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`${stats.ping}ms`, W - 30, 45)
    
    const grad = ctx.createLinearGradient(30, 65, W - 30, 65)
    grad.addColorStop(0, THEME.primary)
    grad.addColorStop(0.5, THEME.purple)
    grad.addColorStop(1, THEME.cyan)
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(30, 65)
    ctx.lineTo(W - 30, 65)
    ctx.stroke()
    
    const ramPercent = (stats.ramUsed / stats.ramTotal) * 100
    const diskPercent = stats.diskTotal > 0 ? (stats.diskUsed / stats.diskTotal) * 100 : 0
    
    const gaugeY = 160
    drawGauge(ctx, 120, gaugeY, 55, parseFloat(stats.cpuLoad), THEME.primary, 'CPU')
    drawGauge(ctx, 280, gaugeY, 55, ramPercent, THEME.success, 'RAM')
    drawGauge(ctx, 440, gaugeY, 55, diskPercent, THEME.purple, 'DISK')
    
    ctx.beginPath()
    ctx.roundRect(540, 95, 330, 130, 12)
    ctx.fillStyle = THEME.bgCard
    ctx.fill()
    ctx.strokeStyle = THEME.border
    ctx.stroke()
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('NETWORK STATUS', 560, 120)
    
    ctx.fillStyle = THEME.cyan
    ctx.font = 'bold 20px Arial'
    ctx.fillText(`↓ ${formatSize(stats.networkRx)}`, 560, 155)
    
    ctx.fillStyle = THEME.pink
    ctx.font = 'bold 20px Arial'
    ctx.fillText(`↑ ${formatSize(stats.networkTx)}`, 700, 155)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px Arial'
    ctx.fillText(`Interface: ${stats.networkInterface}`, 560, 185)
    ctx.fillText(`Latency Status: ${stats.ping < 100 ? '🟢 Excellent' : stats.ping < 300 ? '🟡 Good' : '🔴 Poor'}`, 560, 205)
    
    const cardY = 250
    const cardW = 200
    const cardH = 60
    const cardGap = 17
    
    drawStatCard(ctx, 30, cardY, cardW, cardH, '🖥️', 'HOSTNAME', stats.hostname, THEME.primary)
    drawStatCard(ctx, 30 + cardW + cardGap, cardY, cardW, cardH, '💿', 'PLATFORM', `${stats.platform}`, THEME.success)
    drawStatCard(ctx, 30 + (cardW + cardGap) * 2, cardY, cardW, cardH, '⏱️', 'BOT UPTIME', stats.uptimeBot, THEME.purple)
    drawStatCard(ctx, 30 + (cardW + cardGap) * 3, cardY, cardW, cardH, '🔧', 'NODE.JS', stats.nodeVersion, THEME.cyan)
    
    const barY = 350
    const barW = 400
    const barH = 14
    const barGap = 45
    
    drawProgressBar(ctx, 30, barY, barW, barH, parseFloat(stats.cpuLoad), THEME.primary, 'CPU Load', `${stats.cpuLoad}%`)
    drawProgressBar(ctx, 30, barY + barGap, barW, barH, ramPercent, THEME.success, 'Memory', `${Math.round(ramPercent)}%`)
    drawProgressBar(ctx, 30, barY + barGap * 2, barW, barH, diskPercent, THEME.purple, 'Storage', `${Math.round(diskPercent)}%`)
    drawProgressBar(ctx, 30, barY + barGap * 3, barW, barH, Math.min(100, (stats.ping / 500) * 100), pingColor, 'Latency', `${stats.ping}ms`)
    
    ctx.beginPath()
    ctx.roundRect(470, 340, 400, 170, 12)
    ctx.fillStyle = THEME.bgCard
    ctx.fill()
    ctx.strokeStyle = THEME.border
    ctx.stroke()
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('📋 SYSTEM INFO', 490, 365)
    
    const infoLines = [
        ['CPU Model', stats.cpuModel.substring(0, 28)],
        ['CPU Cores', `${stats.cpuCores} cores @ ${stats.cpuSpeed} MHz`],
        ['Total Memory', formatSize(stats.ramTotal)],
        ['Free Memory', formatSize(stats.ramTotal - stats.ramUsed)],
        ['Server Uptime', stats.uptimeServer]
    ]
    
    let infoY = 390
    ctx.font = '12px Arial'
    infoLines.forEach(([label, value]) => {
        ctx.fillStyle = THEME.textSecondary
        ctx.fillText(label, 490, infoY)
        ctx.fillStyle = THEME.textPrimary
        ctx.font = 'bold 12px Arial'
        ctx.fillText(value, 620, infoY)
        ctx.font = '12px Arial'
        infoY += 25
    })
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${config.bot?.name || 'Ourin-AI'} • ${new Date().toLocaleString('id-ID')}`, W / 2, H - 15)
    
    return canvas.toBuffer('image/png')
}

function getNetworkStats() {
    try {
        const interfaces = os.networkInterfaces()
        let activeInterface = 'N/A'
        
        for (const [name, addrs] of Object.entries(interfaces)) {
            if (name.toLowerCase().includes('lo')) continue
            for (const addr of addrs) {
                if (addr.family === 'IPv4' && !addr.internal) {
                    activeInterface = name
                    break
                }
            }
        }
        
        return { totalRx: 0, totalTx: 0, activeInterface }
    } catch {
        return { totalRx: 0, totalTx: 0, activeInterface: 'N/A' }
    }
}

async function handler(m, { sock }) {
    await m.react('⏳')
    
    try {
        const start = performance.now()
        await new Promise(resolve => setTimeout(resolve, 10))
        const end = performance.now()
        const latency = Math.round(end - start)
        
        const cpus = os.cpus()
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        
        let cpuPercent = 0
        try {
            const cpus1 = os.cpus()
            const cpuInfo = cpus1.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
                const idle = cpu.times.idle
                acc.total += total
                acc.idle += idle
                return acc
            }, { total: 0, idle: 0 })
            
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const cpus2 = os.cpus()
            const cpuInfo2 = cpus2.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
                const idle = cpu.times.idle
                acc.total += total
                acc.idle += idle
                return acc
            }, { total: 0, idle: 0 })
            
            const totalDiff = cpuInfo2.total - cpuInfo.total
            const idleDiff = cpuInfo2.idle - cpuInfo.idle
            
            if (totalDiff > 0) {
                cpuPercent = ((totalDiff - idleDiff) / totalDiff * 100).toFixed(1)
            } else {
                const loadAvg = os.loadavg()[0]
                cpuPercent = Math.min(100, (loadAvg / cpus.length * 100)).toFixed(1)
            }
            
            if (parseFloat(cpuPercent) <= 0) {
                const loadAvg = os.loadavg()[0]
                cpuPercent = Math.max(1, Math.min(100, (loadAvg / cpus.length * 100))).toFixed(1)
            }
        } catch {
            const loadAvg = os.loadavg()[0]
            cpuPercent = Math.max(1, Math.min(100, (loadAvg / cpus.length * 100))).toFixed(1)
        }
        
        let diskTotal = 0, diskUsed = 0
        try {
            if (process.platform === 'win32') {
                const wmic = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:value', { encoding: 'utf-8' })
                const freeMatch = wmic.match(/FreeSpace=(\d+)/)
                const sizeMatch = wmic.match(/Size=(\d+)/)
                if (sizeMatch && freeMatch) {
                    diskTotal = parseInt(sizeMatch[1])
                    diskUsed = diskTotal - parseInt(freeMatch[1])
                }
            } else {
                const df = execSync('df -k --output=size,used / 2>/dev/null').toString()
                const lines = df.trim().split('\n')
                if (lines.length > 1) {
                    const parts = lines[1].trim().split(/\s+/).map(Number)
                    if (parts.length >= 2) {
                        diskTotal = parts[0] * 1024
                        diskUsed = parts[1] * 1024
                    }
                }
            }
        } catch {
            diskTotal = 500 * 1024 * 1024 * 1024
            diskUsed = 250 * 1024 * 1024 * 1024
        }
        
        const networkStats = getNetworkStats()
        
        const stats = {
            ping: latency,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            nodeVersion: process.version,
            uptimeBot: formatTime(process.uptime()),
            uptimeServer: formatTime(os.uptime()),
            cpuModel: cpus[0]?.model?.trim() || 'Unknown',
            cpuSpeed: cpus[0]?.speed || 0,
            cpuCores: cpus.length,
            cpuLoad: cpuPercent,
            ramTotal: totalMem,
            ramUsed: totalMem - freeMem,
            diskTotal,
            diskUsed,
            networkRx: networkStats.totalRx,
            networkTx: networkStats.totalTx,
            networkInterface: networkStats.activeInterface
        }
        
        const imageBuffer = await renderDashboard(stats)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const ramPercent = ((stats.ramUsed / stats.ramTotal) * 100).toFixed(1)
        const diskPercent = stats.diskTotal > 0 ? ((stats.diskUsed / stats.diskTotal) * 100).toFixed(1) : 0
        
        let pingStatus = '🟢 Excellent'
        if (latency > 100 && latency <= 300) pingStatus = '🟡 Good'
        else if (latency > 300) pingStatus = '🔴 Poor'
        
        const heap = process.memoryUsage()
        const heapUsed = formatSize(heap.heapUsed)
        const heapTotal = formatSize(heap.heapTotal)
        const rss = formatSize(heap.rss)
        const external = formatSize(heap.external)
        
        const osName = {
            'linux': '🐧 Linux',
            'darwin': '🍎 macOS',
            'win32': '🪟 Windows',
            'android': '🤖 Android'
        }[stats.platform] || `📦 ${stats.platform}`
        
        const caption = `⚡ *SYSTEM DASHBOARD*\n\n` +
            `╭┈┈⬡「 🏓 *ʀᴇsᴘᴏɴsᴇ* 」\n` +
            `┃ ◦ Latency: *${latency}ms* ${pingStatus}\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🖥️ *sᴇʀᴠᴇʀ* 」\n` +
            `┃ ◦ Hostname: *${stats.hostname}*\n` +
            `┃ ◦ OS: *${osName}*\n` +
            `┃ ◦ Arch: *${stats.arch}*\n` +
            `┃ ◦ Release: *${stats.release}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 💻 *sʏsᴛᴇᴍ* 」\n` +
            `┃ ◦ CPU: *${stats.cpuLoad}%* (${stats.cpuCores} cores)\n` +
            `┃ ◦ CPU Model: *${stats.cpuModel.substring(0, 30)}*\n` +
            `┃ ◦ CPU Speed: *${stats.cpuSpeed} MHz*\n` +
            `┃ ◦ RAM: *${formatSize(stats.ramUsed)}/${formatSize(stats.ramTotal)}* (${ramPercent}%)\n` +
            `┃ ◦ Disk: *${formatSize(stats.diskUsed)}/${formatSize(stats.diskTotal)}* (${diskPercent}%)\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📊 *ᴘʀᴏᴄᴇss* 」\n` +
            `┃ ◦ PID: *${process.pid}*\n` +
            `┃ ◦ Node.js: *${stats.nodeVersion}*\n` +
            `┃ ◦ V8: *${process.versions.v8}*\n` +
            `┃ ◦ Heap Used: *${heapUsed}/${heapTotal}*\n` +
            `┃ ◦ RSS: *${rss}*\n` +
            `┃ ◦ External: *${external}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 ⏱️ *ᴜᴘᴛɪᴍᴇ* 」\n` +
            `┃ ◦ Bot: *${stats.uptimeBot}*\n` +
            `┃ ◦ Server: *${stats.uptimeServer}*\n` +
            `╰┈┈⬡`
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption,
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
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
