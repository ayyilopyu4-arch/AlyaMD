const { getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'hidetag',
    alias: ['ht', 'h'],
    category: 'group',
    description: 'Tag semua member tanpa menampilkan mention',
    usage: '.hidetag <pesan>',
    example: '.hidetag Meeting jam 8 malam',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    limit: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    const text = m.text

    if (!text) {
        await m.reply(
            `❌ *ᴘᴇsᴀɴ ᴋᴏsᴏɴɢ*\n\n` +
            `> Masukkan pesan yang ingin dikirim!\n` +
            `> Contoh: \`${m.prefix}hidetag Halo semua\``
        )
        return
    }

    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []
        const mentions = getParticipantJids(participants)

        await sock.sendMessage(m.chat, {
            text: text,
            mentions
        }, { quoted: m })

    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
