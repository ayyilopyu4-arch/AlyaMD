const upscaler = require('../../src/scraper/upscaler');
const fs = require('fs');
const path = require('path');

const pluginConfig = {
    name: 'upscaler',
    alias: ['upscale', 'enhance', 'hd'],
    category: 'tools',
    description: 'Meningkatkan kualitas gambar dengan AI',
    usage: '.upscaler (reply gambar)',
    example: '.upscaler',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    limit: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && m.quoted.isImage);
        if (!isImage) {
            return await m.reply('❌ *ɢᴀᴍʙᴀʀ ᴅɪʙᴜᴛᴜʜᴋᴀɴ*\n\n> Reply atau kirim gambar dengan caption .upscaler');
        }
        
        await m.reply('⏳ *ᴍᴇɴɪɴɢᴋᴀᴛᴋᴀɴ ᴋᴜᴀʟɪᴛᴀs...*\n\n> Proses ini membutuhkan waktu 10-30 detik');
        
        let mediaBuffer;
        if (m.isImage && m.download) {
            mediaBuffer = await m.download();
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download();
        } else {
            return await m.reply('❌ Gagal mengunduh gambar');
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            return await m.reply('❌ Buffer gambar tidak valid');
        }
        
        const tmpDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const tmpFile = path.join(tmpDir, `upscale_${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, mediaBuffer);
        
        const result = await upscaler(tmpFile);
        
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {}
        
        if (result.status === 'error' || !result.output) {
            return await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.msg || 'Tidak dapat meningkatkan kualitas gambar'}`);
        }
        
        const axios = require('axios');
        const imgRes = await axios.get(result.output, { responseType: 'arraybuffer' });
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(imgRes.data),
            caption: `✨ *ᴜᴘsᴄᴀʟᴇ ʙᴇʀʜᴀsɪʟ*\n\n> Gambar telah ditingkatkan kualitasnya dengan AI`
        }, { quoted: m });
        
    } catch (error) {
        console.error('[Upscaler Error]', error);
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
