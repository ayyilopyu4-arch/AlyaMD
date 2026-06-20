const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'tovideo',
    alias: ['tovid', 'stickertovideo', 'giftomp4', 'webmtomp4'],
    category: 'tools',
    description: 'Mengubah sticker animasi/GIF menjadi video',
    usage: '.tovideo (reply/caption sticker animasi)',
    example: '.tovideo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    limit: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    let mediaSource = null
    let downloadFn = null
    const selfIsSticker = m.isSticker || 
                          m.type === 'stickerMessage' || 
                          m.message?.stickerMessage
    const quotedIsSticker = m.quoted && (
        m.quoted.isSticker || 
        m.quoted.type === 'stickerMessage' || 
        m.quoted.mtype === 'stickerMessage' ||
        m.quoted.message?.stickerMessage
    )
    
    if (selfIsSticker) {
        mediaSource = 'self'
        downloadFn = m.download
    } else if (quotedIsSticker) {
        mediaSource = 'quoted'
        downloadFn = m.quoted.download
    }
    if (!mediaSource) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Tidak ada sticker yang terdeteksi!\n\n` +
            `*Cara penggunaan:*\n` +
            `> 1. Kirim sticker + caption \`${m.prefix}tovideo\`\n` +
            `> 2. Reply sticker dengan \`${m.prefix}tovideo\``
        )
        return
    }

    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengubah sticker menjadi video...`)

    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

    const inputPath = path.join(tempDir, `sticker_${Date.now()}.webp`)
    const outputPath = path.join(tempDir, `video_${Date.now()}.mp4`)

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Tidak dapat mengunduh sticker.\n` +
                `> Sticker mungkin sudah tidak tersedia.`
            )
            return
        }

        fs.writeFileSync(inputPath, buffer)

        try {
            execSync(`ffmpeg -y -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`, { stdio: 'ignore' })
        } catch (e) {
            execSync(`ffmpeg -y -loop 1 -i "${inputPath}" -c:v libx264 -t 3 -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`, { stdio: 'ignore' })
        }

        if (!fs.existsSync(outputPath)) {
            await m.reply(
                `❌ *ᴋᴏɴᴠᴇʀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Gagal mengkonversi sticker ke video.\n` +
                `> Pastikan ffmpeg terinstall dengan benar.`
            )
            return
        }

        const videoBuffer = fs.readFileSync(outputPath)

        await sock.sendMessage(m.chat, {
            video: videoBuffer,
            caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Sticker berhasil diubah menjadi video!`
        }, { quoted: m })

    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Terjadi kesalahan saat memproses.\n` +
            `> _${error.message}_`
        )
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
