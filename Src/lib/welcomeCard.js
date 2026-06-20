const { createCanvas, loadImage } = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const DEFAULT_AVATAR = 'https://i.imgur.com/TuItj4L.png'

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

async function loadAvatarSafe(avatarUrl) {
    const localFallback = path.join(process.cwd(), 'assets', 'images', 'pp-kosong.jpg')
    
    try {
        if (!avatarUrl) {
            if (fs.existsSync(localFallback)) {
                const buffer = fs.readFileSync(localFallback)
                return await loadImage(buffer)
            }
            return await loadImage(DEFAULT_AVATAR)
        }
        
        if (avatarUrl === localFallback || (typeof avatarUrl === 'string' && avatarUrl.includes('pp-kosong'))) {
            if (fs.existsSync(localFallback)) {
                const buffer = fs.readFileSync(localFallback)
                return await loadImage(buffer)
            }
        }
        
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
            const response = await axios.get(avatarUrl, { 
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            return await loadImage(Buffer.from(response.data))
        }
        
        if (fs.existsSync(avatarUrl)) {
            const buffer = fs.readFileSync(avatarUrl)
            return await loadImage(buffer)
        }
        
        if (fs.existsSync(localFallback)) {
            const buffer = fs.readFileSync(localFallback)
            return await loadImage(buffer)
        }
        
        return await loadImage(DEFAULT_AVATAR)
    } catch (err) {
        try {
            if (fs.existsSync(localFallback)) {
                const buffer = fs.readFileSync(localFallback)
                return await loadImage(buffer)
            }
            return await loadImage(DEFAULT_AVATAR)
        } catch {
            return null
        }
    }
}

async function createWideDiscordCard(textMain, username, avatarUrl, memberCount) {
    const width = 1280
    const height = 720
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const bgPath = path.join(process.cwd(), 'assets', 'images', 'ourin-welcome.jpg')
    try {
        if (fs.existsSync(bgPath)) {
            const background = await loadImage(bgPath)
            ctx.drawImage(background, 0, 0, width, height)
        } else {
            ctx.fillStyle = '#2C2F33'
            ctx.fillRect(0, 0, width, height)
        }
    } catch (e) {
        ctx.fillStyle = '#2C2F33'
        ctx.fillRect(0, 0, width, height)
    }

    const cardW = 1000
    const cardH = 300
    const cardX = (width - cardW) / 2
    const cardY = (height - cardH) / 2

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 8
    ctx.shadowOffsetY = 8
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 25)
    ctx.fill()
    ctx.restore()

    const avatarSize = 200
    const avatarX = cardX + 50
    const avatarY = cardY + (cardH - avatarSize) / 2

    const avatar = await loadAvatarSafe(avatarUrl)

    ctx.save()
    ctx.beginPath()
    ctx.arc(avatarX + (avatarSize/2), avatarY + (avatarSize/2), avatarSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    
    if (avatar) {
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
    } else {
        ctx.fillStyle = '#5865F2'
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)
    }
    ctx.restore()

    const statusSize = 45
    const statusX = avatarX + avatarSize - 35
    const statusY = avatarY + avatarSize - 35

    ctx.beginPath()
    ctx.arc(statusX, statusY, statusSize/2 + 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(statusX, statusY, statusSize/2, 0, Math.PI * 2)
    ctx.fillStyle = '#3BA55C'
    ctx.fill()

    const textStartX = avatarX + avatarSize + 40
    const textCenterY = cardY + (cardH / 2)

    ctx.textAlign = 'left'

    ctx.fillStyle = '#B9BBBE'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText("HAS JOINED THE SERVER", textStartX, textCenterY - 50)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 55px sans-serif'
    let displayName = username || 'User'
    if (displayName.length > 18) displayName = displayName.substring(0, 18) + '...'
    ctx.fillText(displayName, textStartX, textCenterY + 15)

    ctx.fillStyle = '#5865F2'
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText(`MEMBER #${memberCount}`, textStartX, textCenterY + 60)

    ctx.fillStyle = '#dcddde'
    ctx.font = 'italic 22px sans-serif'
    ctx.fillText('Welcome! Enjoy your stay in this server!', textStartX, textCenterY + 100)

    return canvas.toBuffer('image/png')
}

async function createGoodbyeCard(textMain, username, avatarUrl, memberCount) {
    const width = 1280
    const height = 720
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const bgPath = path.join(process.cwd(), 'assets', 'images', 'ourin-goodbye.jpg')
    try {
        if (fs.existsSync(bgPath)) {
            const background = await loadImage(bgPath)
            ctx.drawImage(background, 0, 0, width, height)
        } else {
            ctx.fillStyle = '#2C2F33'
            ctx.fillRect(0, 0, width, height)
        }
    } catch (e) {
        ctx.fillStyle = '#2C2F33'
        ctx.fillRect(0, 0, width, height)
    }

    const cardW = 1000
    const cardH = 300
    const cardX = (width - cardW) / 2
    const cardY = (height - cardH) / 2

    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
    ctx.shadowBlur = 15
    ctx.shadowOffsetX = 8
    ctx.shadowOffsetY = 8
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 25)
    ctx.fill()
    ctx.restore()

    const avatarSize = 200
    const avatarX = cardX + 50
    const avatarY = cardY + (cardH - avatarSize) / 2

    const avatar = await loadAvatarSafe(avatarUrl)

    ctx.save()
    ctx.beginPath()
    ctx.arc(avatarX + (avatarSize/2), avatarY + (avatarSize/2), avatarSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    
    if (avatar) {
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
    } else {
        ctx.fillStyle = '#ED4245'
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)
    }
    ctx.restore()

    const statusSize = 45
    const statusX = avatarX + avatarSize - 35
    const statusY = avatarY + avatarSize - 35

    ctx.beginPath()
    ctx.arc(statusX, statusY, statusSize/2 + 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(statusX, statusY, statusSize/2, 0, Math.PI * 2)
    ctx.fillStyle = '#747F8D'
    ctx.fill()

    const textStartX = avatarX + avatarSize + 40
    const textCenterY = cardY + (cardH / 2)

    ctx.textAlign = 'left'

    ctx.fillStyle = '#B9BBBE'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText("HAS LEFT THE SERVER", textStartX, textCenterY - 50)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 55px sans-serif'
    let displayName = username || 'User'
    if (displayName.length > 18) displayName = displayName.substring(0, 18) + '...'
    ctx.fillText(displayName, textStartX, textCenterY + 15)

    ctx.fillStyle = '#ED4245'
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText(`${memberCount} MEMBERS REMAINING`, textStartX, textCenterY + 60)

    ctx.fillStyle = '#dcddde'
    ctx.font = 'italic 22px sans-serif'
    ctx.fillText("We'll miss you... Goodbye!", textStartX, textCenterY + 100)

    return canvas.toBuffer('image/png')
}

module.exports = { createWideDiscordCard, createGoodbyeCard }
          
