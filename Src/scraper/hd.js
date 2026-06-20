const axios = require('axios')
const fs = require('fs')

async function aienhancer(image, {
  model = 3,
  settings = 'kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw='
} = {}) {
  if (!image) throw new Error('image is required')
 let base64
  if (/^https?:\/\//.test(image)) {
    const img = await axios.get(image, { responseType: 'arraybuffer' })
    base64 = Buffer.from(img.data).toString('base64')
  } else {
    base64 = fs.readFileSync(image).toString('base64')
  }

  const headers = {
    authority: 'aienhancer.ai',
    accept: '*/*',
    'accept-language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6',
    'content-type': 'application/json',
    origin: 'https://aienhancer.ai',
    referer: 'https://aienhancer.ai/hd-picture-converter',
    'sec-ch-ua': '\'Chromium\';v=\'139\', \'Not;A=Brand\';v=\'99\'',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '\'Android\'',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
  }

  const create = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create',
    {
      model,
      image: 'data:image/png;base64,' + base64,
      settings
    },
    { headers }
  )

 const taskId = create.data?.data?.id

  while (true) {
    await new Promise(r => setTimeout(r, 2000))

    const result = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result',
      { task_id: taskId },
      { headers }
    )

    const status = result.data?.data?.status

    if (status === 'succeeded') {
      return {
        id: result.data.data.id,
        input: result.data.data.input,
        output: result.data.data.output,
        completed_at: result.data.data.completed_at
      }
    }

    if (status === 'failed') {
      throw new Error('Enhance gagal')
    }
  }
}

module.exports = aienhancer

