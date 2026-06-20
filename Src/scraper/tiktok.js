const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// const __dirname = path.resolve();

async function uploadToCloud(filePath, customFileName) {
    try {
        const stats = fs.statSync(filePath);
        const originalName = customFileName || path.basename(filePath);
        const ext = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, ext);
        const fileKey = `${nameWithoutExt}-${Date.now()}${ext}`;

        const contentType = mime.lookup(filePath) || 'application/octet-stream';

        const { data } = await axios.post(
            'https://api.cloudsky.biz.id/get-upload-url',
            {
                fileKey,
                contentType,
                fileSize: stats.size
            }
        );

        await axios.put(data.uploadUrl, fs.readFileSync(filePath), {
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size,
                'x-amz-server-side-encryption': 'AES256'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        return `https://api.cloudsky.biz.id/file?key=${encodeURIComponent(fileKey)}`;
    } catch (e) {
        console.error(`[Upload Cloud Error] ${customFileName}:`, e.message);
        return null;
    }
}

async function downloadVideo(url, outputPath, apiInstance) {
    try {
        const response = await apiInstance.get(url, {
            responseType: 'arraybuffer',
            headers: {
                Referer: 'https://www.tiktok.com/',
                Range: 'bytes=0-'
            }
        });

        fs.writeFileSync(outputPath, Buffer.from(response.data));
        return true;
    } catch (e) {
        console.error('[Download Error]:', e.message);
        return false;
    }
}

async function tiktok(url) {
    const jar = new CookieJar();

    const api = axios.create({
        jar,
        withCredentials: true,
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
            Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        }
    });

    wrapper(api);

    try {
        console.log('Please Wait...');
        const htmlResponse = await api.get(url);
        const $ = cheerio.load(htmlResponse.data);

        let scriptContent =
            $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html() ||
            $('#SIGI_STATE').html();

        if (!scriptContent)
            throw new Error('Script tag data tidak ditemukan (Captcha/IP Blocked).');

        const jsonData = JSON.parse(scriptContent);

        const defaultScope = jsonData?.__DEFAULT_SCOPE__;
        const itemStruct =
            defaultScope?.['webapp.video-detail']?.itemInfo?.itemStruct ||
            Object.values(jsonData.ItemModule || {})[0];

        if (!itemStruct)
            throw new Error('Struct video tidak ditemukan dalam JSON.');

        const videoId = itemStruct.id;
        const videoData = itemStruct.video;
        const watermarkUrl = videoData.downloadAddr || videoData.playAddr;

        let hdNoWatermarkUrl = null;
        let bitrateLabel = 0;
        let qualityLabel = 'Original';

        if (Array.isArray(videoData.bitrateInfo)) {
            const bestQuality = videoData.bitrateInfo.sort(
                (a, b) => b.Bitrate - a.Bitrate
            )[0];

            if (bestQuality) {
                bitrateLabel = bestQuality.Bitrate;
                qualityLabel = bestQuality.QualityType;
                const urlList = bestQuality.PlayAddr?.UrlList || [];
                hdNoWatermarkUrl =
                    urlList.find(u => u.includes('aweme/v1/play')) ||
                    urlList[urlList.length - 1];
            }
        }

        if (!hdNoWatermarkUrl) hdNoWatermarkUrl = videoData.playAddr;

        const finalResult = {
            metadata: {
                id: videoId,
                description: itemStruct.desc,
                createTime: new Date(itemStruct.createTime * 1000).toLocaleString(),
                region: itemStruct.locationCreated || 'N/A',
                hashtags:
                    itemStruct.challenges?.map(tag => ({
                        id: tag.id,
                        name: tag.title
                    })) || []
            },
            originalUrl: {
                watermark: watermarkUrl,
                hd_nonwatermark: hdNoWatermarkUrl
            },
            cloudUrl: {
                watermark: null,
                hd_nonwatermark: null
            },
            videoInfo: {
                duration: videoData?.duration,
                resolution: `${videoData?.width}x${videoData?.height}`,
                format: videoData?.format,
                codec: videoData?.codecType,
                bitrate: bitrateLabel,
                quality: qualityLabel,
                cover: {
                    static: videoData?.cover,
                    dynamic: videoData?.dynamicCover,
                    origin: videoData?.originCover
                }
            },
            author: {
                id: itemStruct.author?.id,
                uniqueId: itemStruct.author?.uniqueId,
                nickname: itemStruct.author?.nickname,
                signature: itemStruct.author?.signature,
                avatar:
                    itemStruct.author?.avatarLarger ||
                    itemStruct.author?.avatarThumb,
                verified: itemStruct.author?.verified
            },
            music: {
                id: itemStruct.music?.id,
                title: itemStruct.music?.title,
                author: itemStruct.music?.authorName,
                cover: itemStruct.music?.coverLarge,
                playUrl: itemStruct.music?.playUrl,
                isOriginal: itemStruct.music?.original
            },
            stats: {
                views:
                    itemStruct.statsV2?.playCount ||
                    itemStruct.stats?.playCount,
                likes:
                    itemStruct.statsV2?.diggCount ||
                    itemStruct.stats?.diggCount,
                comments:
                    itemStruct.statsV2?.commentCount ||
                    itemStruct.stats?.commentCount,
                shares:
                    itemStruct.statsV2?.shareCount ||
                    itemStruct.stats?.shareCount,
                saves:
                    itemStruct.statsV2?.collectCount ||
                    itemStruct.stats?.collectCount
            }
        };

        if (watermarkUrl) {
            const wmPath = path.join(__dirname, `wm_${videoId}.mp4`);
            if (await downloadVideo(watermarkUrl, wmPath, api)) {
                const cloudLink = await uploadToCloud(
                    wmPath,
                    `tiktok_wm_${videoId}.mp4`
                );
                if (cloudLink) finalResult.cloudUrl.watermark = cloudLink;
                if (fs.existsSync(wmPath)) fs.unlinkSync(wmPath);
            }
        }

        if (hdNoWatermarkUrl) {
            const hdPath = path.join(__dirname, `hd_${videoId}.mp4`);
            if (await downloadVideo(hdNoWatermarkUrl, hdPath, api)) {
                const cloudLink = await uploadToCloud(
                    hdPath,
                    `tiktok_hd_${videoId}.mp4`
                );
                if (cloudLink) finalResult.cloudUrl.hd_nonwatermark = cloudLink;
                if (fs.existsSync(hdPath)) fs.unlinkSync(hdPath);
            }
        }

        return {
            status: true,
            result: finalResult
        };
    } catch (error) {
        console.error('Error Main Process:', error.message);
        return { status: false, error: error.message };
    }
}

module.exports = {
    tiktok
};
// SAMPEL RESPONSE
// {
//   status: true,
//   result: {
//     metadata: {
//       id: '7396061809142271237',
//       description: 'Membuat layanan VPS hosting menggunakan Docker di VPS berbasis Kali Linux memungkinkan pengguna untuk menjalankan beberapa container Ubuntu dengan port yang berbeda. Portainer digunakan untuk manajemen Docker, dan port mapping di Docker mengatur akses SSH ke setiap container tanpa mengubah sistem operasi dasar dari VPS, yang tetap Kali Linux. #ubuntu #kalilinuxtutorial ',
//       createTime: '7/27/2024, 4:37:18 AM',
//       region: 'ID',
//       hashtags: [Array]
//     },
//     originalUrl: {
//       watermark: 'https://v16-webapp-prime.tiktok.com/video/tos/maliva/tos-maliva-ve-0068c801-us/o8B6RVDFp2BfSC1mko5CJSIEQS6FIEmNBEQAxf/?a=1988&bti=ODszNWYuMDE6&ch=0&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C&br=1828&bt=914&cs=0&ds=3&ft=-Csk_mc3PD12NzVRzd-Uxs4FWY6e3wv25HcAp&mime_type=video_mp4&qs=0&rc=OmY8PGg5Nmc7M2U5ZmdlNEBpM3lmM3c5cjU0dDMzNzczM0AxNDZjNDRhNV8xNTVeNjA1YSM2YV5eMmQ0NmZgLS1kMTZzcw%3D%3D&btag=e000b8000&expire=1768449736&l=2026011312015602BFF5458C315C73951E&ply_type=2&policy=2&signature=15b84fa00d02d53a9155571818c5b878&tk=tt_chain_token',
//       hd_nonwatermark: 'https://www.tiktok.com/aweme/v1/play/?faid=1988&file_id=1b2c07ba4b874751b428afad7fec2e25&is_play_url=1&item_id=7396061809142271237&line=0&ply_type=2&signaturev3=dmlkZW9faWQ7ZmlsZV9pZDtpdGVtX2lkLmFkZjc3ZjBiMTExY2IxYWVjOWNjYTRkYjkxZjNhODA0&tk=tt_chain_token&video_id=v09044g40000cqi1927og65ta0acdv90'
//     },
//     cloudUrl: {
//       watermark: 'https://api.cloudsky.biz.id/file?key=tiktok_wm_7396061809142271237-1768276649819.mp4',
//       hd_nonwatermark: 'https://api.cloudsky.biz.id/file?key=tiktok_hd_7396061809142271237-1768276659122.mp4'
//     },
//     videoInfo: {
//       duration: 20,
//       resolution: '576x1024',
//       format: 'mp4',
//       codec: 'h264',
//       bitrate: 867839,
//       quality: 20,
//       cover: [Object]
//     },
//     author: {
//       id: '6808078154194174977',
//       uniqueId: 'chenggu_4',
//       nickname: '诚固',
//       signature: 'Xiaohongshu ID: 95682519703',
//       avatar: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/1259b448f0fc95e923bffef1cebbe03a~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=698288d8&x-expires=1768449600&x-signature=n7VvRqYsnKtOqSI7ZxVN0fIGBbY%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my',
//       verified: false
//     },
//     music: {
//       id: '7396061803465640710',
//       title: 'suara asli - Chenggu',
//       author: '诚固',
//       cover: 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/1259b448f0fc95e923bffef1cebbe03a~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=698288d8&x-expires=1768449600&x-signature=n7VvRqYsnKtOqSI7ZxVN0fIGBbY%3D&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=81f88b70&idc=my',
//       playUrl: 'https://v16m.tiktokcdn.com/5b00cf7ea3f2d968ba9a3b9f0ee8848c/69671549/video/tos/useast2a/tos-useast2a-v-27dcd7/osEBzUA5xOIgKA50zHug0aABiCkxkrAEGofiEF/?a=1180&bti=ODszNWYuMDE6&ch=0&cr=0&dr=0&er=0&lr=default&cd=0%7C0%7C0%7C0&br=252&bt=126&ds=5&ft=.NpOcInz7Thb6ZbPXq8Zmo&mime_type=audio_mpeg&qs=13&rc=amVzNHM5cjc0dDMzNzU8M0BpamVzNHM5cjc0dDMzNzU8M0BwaWVuMmRjYmZgLS1kMTZzYSNwaWVuMmRjYmZgLS1kMTZzcw%3D%3D&vvpl=1&l=2026011312015602BFF5458C315C73951E&btag=e00078000&cc=3',     
//       isOriginal: true
//     },
//     stats: {
//       views: '468',
//       likes: '15',
//       comments: '1',
//       shares: '1',
//       saves: '1'
//     }
//   }
// }
