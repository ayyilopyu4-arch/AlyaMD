const axios = require('axios')
const { CookieJar } = require('tough-cookie')
const { wrapper } = require('axios-cookiejar-support')
const FormData = require('form-data')

const sleep = ms => new Promise(r => setTimeout(r, ms))

const TEMP_HEADERS = {
    'Content-Type': 'application/json',
    'Application-Name': 'web',
    'Application-Version': '4.0.0',
    'X-CORS-Header': 'iaWg3pchvFx48fY'
}

async function nanoBanana(imageBuffer, prompt, options = {}) {
    const jar = new CookieJar()
    
    const client = wrapper(
        axios.create({
            jar,
            withCredentials: true,
            timeout: 60000,
            validateStatus: () => true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': '*/*'
            }
        })
    )

    const name = `ourinapi_${Math.random().toString(36).slice(2, 8)}`
    const emailRes = await client.post(
        'https://api.internal.temp-mail.io/api/v3/email/new',
        { name, domain: 'illubd.com' },
        { headers: TEMP_HEADERS }
    )
    if (!emailRes.data?.email) throw new Error('TEMP_MAIL_FAILED')
    const email = emailRes.data.email

    const csrfRes = await client.get('https://nanabanana.ai/api/auth/csrf')
    if (!csrfRes.data?.csrfToken) throw new Error('CSRF_NOT_FOUND')
    const csrfToken = csrfRes.data.csrfToken

    const otpRes = await client.post(
        'https://nanabanana.ai/api/auth/email-verification',
        { email },
        { headers: { 'Content-Type': 'application/json' } }
    )
    if (otpRes.data?.code !== 0) throw new Error('SEND_OTP_FAILED')

    let otp = null
    for (let i = 0; i < 30; i++) {
        const inbox = await client.get(
            `https://api.internal.temp-mail.io/api/v3/email/${email}/messages`,
            { headers: TEMP_HEADERS }
        )

        const mail = Array.isArray(inbox.data)
            ? inbox.data.find(m => m.subject?.includes('Verification Code'))
            : null

        if (mail?.body_text) {
            const code = mail.body_text.match(/\b\d{6}\b/)
            if (code) {
                otp = code[0]
                break
            }
        }

        await sleep(5000)
    }
    if (!otp) throw new Error('OTP_TIMEOUT')

    await client.post(
        'https://nanabanana.ai/api/auth/callback/email-verification',
        new URLSearchParams({
            csrfToken,
            email,
            code: otp,
            json: 'true'
        }).toString(),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            maxRedirects: 0
        }
    )

    const sessionRes = await client.get('https://nanabanana.ai/api/auth/session')
    if (!sessionRes.data?.user) throw new Error('LOGIN_FAILED')

    const cookies = await jar.getCookies('https://nanabanana.ai')
    const session = cookies.find(c => c.key === '__Secure-authjs.session-token')
    if (!session) throw new Error('SESSION_COOKIE_MISSING')

    const form = new FormData()
    form.append('file', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })

    const uploadRes = await client.post(
        'https://nanabanana.ai/api/upload',
        form,
        { headers: form.getHeaders() }
    )

    if (!uploadRes.data?.url) throw new Error('UPLOAD_FAILED')
    const imageUrl = uploadRes.data.url

    const payload = {
        prompt: prompt,
        image_urls: [imageUrl],
        output_format: 'png',
        image_size: 'auto',
        enable_pro: true,
        resolution: options.resolution || '4K',
        width: options.width || 1024,
        height: options.height || 1024,
        steps: options.steps || 20,
        guidance_scale: options.guidance_scale || 7.5,
        is_public: false
    }

    const createRes = await client.post(
        'https://nanabanana.ai/api/image-generation-nano-banana/create',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
    )

    if (!createRes.data?.task_id) throw new Error('CREATE_TASK_FAILED')
    const taskId = createRes.data.task_id

    let resultUrl = null
    for (let i = 0; i < 60; i++) {
        const statusRes = await client.post(
            'https://nanabanana.ai/api/image-generation-nano-banana/status',
            { taskId },
            { headers: { 'Content-Type': 'application/json' } }
        )

        const gen = statusRes.data?.generations?.[0]
        if (!gen) throw new Error('STATUS_INVALID')

        if (gen.status === 'succeed') {
            resultUrl = gen.url
            break
        }

        if (gen.status === 'failed' || gen.status === 'error') {
            throw new Error(`TASK_FAILED: ${gen.failMsg || 'Unknown error'}`)
        }

        if (gen.status !== 'waiting') {
            if (gen.url) {
                resultUrl = gen.url
                break
            }
        }

        await sleep(4000)
    }

    if (!resultUrl) throw new Error('TIMEOUT')

    const imgRes = await axios.get(resultUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000
    })
    
    return Buffer.from(imgRes.data)
}

module.exports = nanoBanana
