const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');

const pluginConfig = {
    name: 'setmenu',
    alias: ['menuvariant', 'menustyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan menu',
    usage: '.setmenu <v1/v2/v3/v4/v5/v6/v7/v8>',
    example: '.setmenu v8',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

const VARIANTS = {
    v1: { id: 1, name: 'Simple', desc: 'Image biasa tanpa contextInfo' },
    v2: { id: 2, name: 'Standard', desc: 'Image + full contextInfo (default)' },
    v3: { id: 3, name: 'Document', desc: 'Document + jpegThumbnail + verified quoted' },
    v4: { id: 4, name: 'Video', desc: 'Video + contextInfo + verified quoted' },
    v5: { id: 5, name: 'Button', desc: 'Image + buttons (single_select & quick_reply)' },
    v6: { id: 6, name: 'Document Premium', desc: 'Document + jpegThumbnail 1280x450 + full contextInfo' },
    v7: { id: 7, name: 'Carousel', desc: 'Swipeable cards per kategori (modern)' },
    v8: { id: 8, name: 'Minimalist', desc: 'Image + ftroli quoted + fresh design' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();
    
    if (!variant) {
        const current = db.setting('menuVariant') || config.ui?.menuVariant || 2;
        
        let txt = `🎨 *sᴇᴛ ᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ*\n\n`;
        txt += `> Variant saat ini: *V${current}*\n\n`;
        txt += `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n`;
        
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> *${key.toUpperCase()}*${mark}\n`;
            txt += `> _${val.desc}_\n\n`;
        }
        
        txt += `_Gunakan: \`.setmenu v1\` dst._`;
        
        await m.reply(txt);
        return;
    }
    
    const selected = VARIANTS[variant];
    if (!selected) {
        await m.reply(`❌ Variant tidak valid!\n\nGunakan: v1, v2, v3, v4, v5, v6, v7, atau v8`);
        return;
    }
    
    db.setting('menuVariant', selected.id);
    await db.save();
    
    await m.reply(
        `✅ Menu variant diubah ke *V${selected.id}*\n\n` +
        `> *${selected.name}*\n` +
        `> _${selected.desc}_`
    );
}

module.exports = {
    config: pluginConfig,
    handler
};
