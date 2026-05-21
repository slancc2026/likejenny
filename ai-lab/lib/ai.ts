/**
 * AI API 封装
 * 方舟平台: GPT Image 2（文生图 / 图生图）
 * 阿里云百炼: qwen-plus（文案生成）
 *
 * ⚠️ 重要: 图生图(edits)接口绝对不能传 negative_prompt，否则报错
 */

const FANGZHOU_BASE_URL = process.env.FANGZHOU_BASE_URL || 'https://api.aiyungc.cn/v1'
const FANGZHOU_API_KEY = process.env.FANGZHOU_API_KEY!
const FANGZHOU_MODEL = process.env.FANGZHOU_IMAGE_MODEL || 'gpt-image-2'

const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY!
const DASHSCOPE_MODEL = process.env.DASHSCOPE_MODEL || 'qwen-plus'

// ── 文生图 ──────────────────────────────────────────
export interface GenerateImageOptions {
  prompt: string
  size?: '1024x1024' | '1024x1365' | '1024x1820' | '1024x1536'
  quality?: 'low' | 'medium' | 'high'
  n?: number
}

export async function generateImage(opts: GenerateImageOptions): Promise<string[]> {
  const { prompt, size = '1024x1024', quality = 'medium', n = 1 } = opts

  const res = await fetch(`${FANGZHOU_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FANGZHOU_API_KEY}`,
    },
    body: JSON.stringify({
      model: FANGZHOU_MODEL,
      prompt,
      size,
      quality,
      n,
      response_format: 'b64_json',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`图片生成失败: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.data.map((item: { b64_json: string }) => item.b64_json)
}

// ── 图生图（菜品精修）──────────────────────────────
// ⚠️ 绝对不能传 negative_prompt！
export interface EditImageOptions {
  imageBase64: string   // 原图 base64（不含 data: 前缀）
  imageMediaType?: string
  prompt: string
  size?: '1024x1024'
  quality?: 'low' | 'medium' | 'high'
}

export async function editImage(opts: EditImageOptions): Promise<string> {
  const { imageBase64, imageMediaType = 'image/jpeg', prompt, size = '1024x1024', quality = 'medium' } = opts

  // 构建 multipart/form-data
  const formData = new FormData()
  // 将 base64 转为 Blob
  const byteString = atob(imageBase64)
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i)
  const blob = new Blob([bytes], { type: imageMediaType })
  formData.append('image', blob, 'image.jpg')
  formData.append('model', FANGZHOU_MODEL)
  formData.append('prompt', prompt)
  formData.append('size', size)
  formData.append('quality', quality)
  // ⚠️ 不传 negative_prompt，不传 response_format

  const res = await fetch(`${FANGZHOU_BASE_URL}/images/edits`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FANGZHOU_API_KEY}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`图片精修失败: ${res.status} ${err}`)
  }

  const data = await res.json()
  // 兼容返回 url 或 b64_json
  if (data.data?.[0]?.url) return data.data[0].url
  return data.data[0].b64_json
}

// ── 文案生成（百炼 qwen-plus）────────────────────
export async function generateCopy(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: DASHSCOPE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`文案生成失败: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}
