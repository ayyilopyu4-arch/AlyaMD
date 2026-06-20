/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Owner = Syura Salsabila
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 * 
 */

const fs = require('fs');
const path = require('path');
const { downloadMediaMessage, getContentType } = require('ourin');
const { addExifToWebp, DEFAULT_METADATA } = require('./exif');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { config } = require('./../../config');

/**
 * Get temp directory
 */
function getTempDir() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
}

/**
 * Download buffer from URL
 */
async function downloadBuffer(url) {
    const axios = require('axios');
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    return Buffer.from(response.data);
}

/**
 * Convert image buffer to WebP sticker using sharp
 */
async function imageToWebp(buffer) {
    try {
        const sharp = require('sharp');
        return await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (error) {
        throw new Error('Failed to convert image to webp: ' + error.message);
    }
}

/**
 * Convert video to WebP sticker using fluent-ffmpeg
 */
function videoToWebp(buffer) {
    return new Promise((resolve, reject) => {
        const tmpDir = getTempDir();
        const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
        const outputPath = path.join(tmpDir, `output_${Date.now()}.webp`);
        
        fs.writeFileSync(inputPath, buffer);
        
        ffmpeg(inputPath)
            .inputOptions(['-y'])
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', "fps=15,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1",
                '-loop', '0',
                '-ss', '0',
                '-t', '5',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', () => {
                try {
                    const webpBuffer = fs.readFileSync(outputPath);
                    // Cleanup
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(webpBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                // Cleanup on error
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            })
            .save(outputPath);
    });
}

/**
 * Simple image to webp without sharp (using raw webp)
 */
async function simpleImageToWebp(buffer) {
    const tmpDir = getTempDir();
    const inputPath = path.join(tmpDir, `img_${Date.now()}.png`);
    const outputPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);
    
    fs.writeFileSync(inputPath, buffer);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', () => {
                try {
                    const webpBuffer = fs.readFileSync(outputPath);
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(webpBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            })
            .save(outputPath);
    });
}

/**
 * Extend socket with helper methods
 */
function extendSocket(sock) {
    /**
     * Send image as sticker
     */
    sock.sendImageAsSticker = async (jid, input, m, options = {}) => {
        let buffer;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        
        let webpBuffer;
        try {
            const sharp = require('sharp');
            webpBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 80 })
                .toBuffer();
        } catch (err) {
            throw new Error('Failed to convert image: ' + err.message);
        }
        try {
            webpBuffer = await addExifToWebp(webpBuffer, {
                packname: options.packname || DEFAULT_METADATA.packname,
                author: options.author || DEFAULT_METADATA.author,
                emojis: options.emojis || DEFAULT_METADATA.emojis
            });
        } catch (e) {
            console.log('[Sticker] EXIF error:', e.message);
        }
        
        return sock.sendMessage(jid, {
            sticker: webpBuffer,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
            }
        }, {
            quoted: m
        });
    };
    
    /**
     * Send video as sticker (animated)
     */
    sock.sendVideoAsSticker = async (jid, input, m, options = {}) => {
        let buffer;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        let webpBuffer = await videoToWebp(buffer);
        try {
            webpBuffer = await addExifToWebp(webpBuffer, {
                packname: options.packname || DEFAULT_METADATA.packname,
                author: options.author || DEFAULT_METADATA.author,
                emojis: options.emojis || DEFAULT_METADATA.emojis
            });
        } catch (e) {
            console.log('[Sticker] EXIF error:', e.message);
        }
        
        return sock.sendMessage(jid, {
            sticker: webpBuffer,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
            }
        }, {
            quoted: m
        });
    };
    
    /**
     * Send file (auto-detect type)
     */
    sock.sendFile = async (jid, input, options = {}) => {
        let buffer;
        let filename = options.filename || 'file';
        let mimetype = options.mimetype;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
                filename = options.filename || path.basename(new URL(input).pathname) || 'file';
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
                filename = options.filename || path.basename(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        if (!mimetype) {
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.mp4': 'video/mp4',
                '.mp3': 'audio/mpeg',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
                '.zip': 'application/zip'
            };
            mimetype = mimeTypes[ext] || 'application/octet-stream';
        }
        
        let messageContent = {};
        
        if (mimetype.startsWith('image/')) {
            messageContent.image = buffer;
            if (options.caption) messageContent.caption = options.caption;
        } else if (mimetype.startsWith('video/')) {
            messageContent.video = buffer;
            messageContent.mimetype = mimetype;
            if (options.caption) messageContent.caption = options.caption;
        } else if (mimetype.startsWith('audio/')) {
            messageContent.audio = buffer;
            messageContent.mimetype = mimetype;
            messageContent.ptt = options.ptt || false;
        } else {
            messageContent.document = buffer;
            messageContent.mimetype = mimetype;
            messageContent.fileName = filename;
            if (options.caption) messageContent.caption = options.caption;
        }
        
        return sock.sendMessage(jid, messageContent, {
            quoted: options.quoted
        });
    };
    
    /**
     * Send contact card
     */
    sock.sendContact = async (jid, contacts, options = {}) => {
        const contactArray = Array.isArray(contacts) ? contacts : [contacts];
        
        const vcards = contactArray.map(contact => {
            const name = contact.name || 'Unknown';
            const number = contact.number?.replace(/[^0-9]/g, '') || '';
            const org = contact.org || '';
            
            let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
            vcard += `FN:${name}\n`;
            if (org) vcard += `ORG:${org}\n`;
            vcard += `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n`;
            vcard += `END:VCARD`;
            
            return { vcard };
        });
        
        const displayName = contactArray.length === 1 
            ? contactArray[0].name || 'Contact'
            : `${contactArray.length} Contacts`;
        
        return sock.sendMessage(jid, {
            contacts: {
                displayName,
                contacts: vcards
            }
        }, {
            quoted: options.quoted
        });
    };
    
    /**
     * Download media message and save to file
     */
    sock.downloadAndSaveMediaMessage = async (msg, savePath = null) => {
        const message = msg.message || msg;
        const type = getContentType(message);
        
        if (!type) {
            throw new Error('No media found in message');
        }
        
        const buffer = await downloadMediaMessage(
            { message },
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );
        
        let savedPath = null;
        
        if (savePath) {
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(savePath, buffer);
            savedPath = savePath;
        }
        
        return {
            buffer,
            path: savedPath,
            type
        };
    };
    
    /**
     * Get name/pushName from a JID
     * Handles LID resolution for groups
     * @param {string} jid - Target JID
     * @param {string} [groupJid] - Optional group JID for LID resolution
     * @returns {Promise<string>} Name or phone number fallback
     */
    sock.getName = async (jid, groupJid = null) => {
        if (!jid) return 'Unknown';
        
        const { isLid, isLidConverted, resolveAnyLidToJid, getCachedJid } = require('./lidHelper');
        
        let id = jid;
        if (isLid(jid) || isLidConverted(jid)) {
            const cached = getCachedJid(jid);
            if (cached) {
                id = cached;
            } else if (groupJid) {
                try {
                    const groupMeta = await sock.groupMetadata(groupJid);
                    id = resolveAnyLidToJid(jid, groupMeta.participants || []);
                } catch {
                    id = jid.replace('@lid', '@s.whatsapp.net');
                }
            } else {
                id = jid.replace('@lid', '@s.whatsapp.net');
            }
        }
        
        if (id.endsWith('@g.us')) {
            try {
                let v = sock.store?.contacts?.[id] || {};
                if (!(v.name || v.subject)) {
                    v = await sock.groupMetadata(id).catch(() => ({}));
                }
                return v.name || v.subject || id.split('@')[0];
            } catch {
                return id.split('@')[0];
            }
        }
        
        if (id === '0@s.whatsapp.net') {
            return 'WhatsApp';
        }
        
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (id === botId) {
            return sock.user?.name || sock.user?.verifiedName || 'Bot';
        }
        
        let v = sock.store?.contacts?.[id] || {};
        
        if (v.name) return v.name;
        if (v.notify) return v.notify;
        if (v.pushName) return v.pushName;
        if (v.verifiedName) return v.verifiedName;
        if (v.subject) return v.subject;
        
        if (groupJid) {
            try {
                const groupMeta = await sock.groupMetadata(groupJid);
                const targetNum = id.replace(/[^0-9]/g, '');
                const participant = groupMeta.participants?.find(p => {
                    const pNum = (p.jid || p.id || '').replace(/[^0-9]/g, '');
                    return pNum === targetNum;
                });
                if (participant) {
                    const pJid = participant.jid || participant.id || '';
                    if (sock.store?.contacts?.[pJid]) {
                        const contact = sock.store.contacts[pJid];
                        if (contact.name) return contact.name;
                        if (contact.notify) return contact.notify;
                        if (contact.pushName) return contact.pushName;
                    }
                }
            } catch {}
        }
        
        try {
            if (sock.getBusinessProfile) {
                const profile = await sock.getBusinessProfile(id).catch(() => null);
                if (profile?.wid?.user) {
                    const profileName = profile.name || profile.pushname || profile.verifiedName;
                    if (profileName) {
                        if (sock.store?.contacts) {
                            sock.store.contacts[id] = { ...sock.store.contacts[id], name: profileName };
                        }
                        return profileName;
                    }
                }
            }
        } catch {}
        
        try {
            if (sock.onWhatsApp) {
                const [result] = await sock.onWhatsApp(id).catch(() => []);
                if (result?.exists && result?.jid) {
                    const contactJid = result.jid;
                    if (sock.store?.contacts?.[contactJid]) {
                        const contact = sock.store.contacts[contactJid];
                        if (contact.name) return contact.name;
                        if (contact.notify) return contact.notify;
                    }
                }
            }
        } catch {}
        
        const number = id.replace(/@.+/g, '');
        if (number && number.length > 0) {
            if (number.startsWith('62')) {
                return '+62' + number.slice(2);
            }
            return '+' + number;
        }
        
        return 'Unknown';
    };

    
    /**
     * Get name from group participant (with cacing :c)
     * @param {string} jid - Target JID
     * @param {Object[]} participants - Group participants array
     * @returns {string} Name or phone number
     */
    sock.getNameFromParticipants = (jid, participants = []) => {
        if (!jid) return 'Unknown';
        
        const { isLid, isLidConverted, resolveAnyLidToJid } = require('./lidHelper');
        
        let resolvedJid = jid;
        
        if (isLid(jid) || isLidConverted(jid)) {
            resolvedJid = resolveAnyLidToJid(jid, participants);
        }
        
        const targetNum = resolvedJid.replace(/[^0-9]/g, '');
        const participant = participants.find(p => {
            const pNum = (p.jid || p.id || '').replace(/[^0-9]/g, '');
            return pNum === targetNum;
        });
        
        if (participant) {
            const pJid = participant.jid || participant.id || '';
            if (sock.store?.contacts?.[pJid]) {
                const contact = sock.store.contacts[pJid];
                if (contact.name) return contact.name;
                if (contact.notify) return contact.notify;
            }
        }
        const number = resolvedJid.replace(/@.+/g, '');
        if (number.startsWith('62')) {
            return '0' + number.slice(2);
        }
        return number || 'Unknown';
    };

    sock.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
    };

    sock.reply = (jid, text = '', quoted, options = {}) => {
        return Buffer.isBuffer(text) 
            ? sock.sendMessage(jid, { document: text, ...options }, { quoted })
            : sock.sendMessage(jid, { ...options, text, mentions: sock.parseMention(text) }, { quoted, ...options, mentions: sock.parseMention(text) });
    };

    sock.cMod = async (jid, message, text = '', sender = sock.user?.id, options = {}) => {
        const { proto, areJidsSameUser } = require('ourin');
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions];
        let copy = message.toJSON ? message.toJSON() : JSON.parse(JSON.stringify(message));
        delete copy.message?.messageContextInfo;
        delete copy.message?.senderKeyDistributionMessage;
        let mtype = Object.keys(copy.message || {})[0];
        let msg = copy.message;
        let content = msg?.[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content?.caption) content.caption = text || content.caption;
        else if (content?.text) content.text = text || content.text;
        if (typeof content !== 'string' && content) {
            msg[mtype] = { ...content, ...options };
            msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.c
