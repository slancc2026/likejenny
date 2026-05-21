'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Image, MessageSquare, Trash2, Download, Loader2, ChevronDown, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Mode = 'text' | 'image'

interface TextMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ImageMessage {
  role: 'user' | 'assistant'
  content: string
  inputImageUrl?: string  // 用户上传的原图预览
  imageUrl?: string       // AI生成的图
  timestamp: Date
}

const TEXT_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', desc: '最强推理' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: '快速经济' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: '经典模型' },
  { id: 'qwen-plus', name: 'Qwen Plus', desc: '通义千问' },
  { id: 'qwen-max', name: 'Qwen Max', desc: '千问旗舰' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', desc: '深度求索' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', desc: '推理增强' },
]

const IMAGE_MODELS = [
  { id: 'gpt-image-2', name: 'GPT Image 2', desc: 'OpenAI 主力' },
  { id: 'dall-e-3', name: 'DALL-E 3', desc: '高质量写实' },
  { id: 'dall-e-2', name: 'DALL-E 2', desc: '经典版本' },
  { id: 'stable-diffusion-3', name: 'SD 3', desc: '开源主力' },
  { id: 'flux-1-pro', name: 'FLUX.1 Pro', desc: '新生代模型' },
  { id: 'flux-1-schnell', name: 'FLUX.1 Schnell', desc: '极速生成' },
]

const IMAGE_SIZES = [
  { id: '1024x1024', label: '1:1 方形' },
  { id: '1024x1365', label: '3:4 竖版' },
  { id: '1024x1820', label: '9:16 竖屏' },
]

export default function ChatPage() {
  const [mode, setMode] = useState<Mode>('text')
  const [textModel, setTextModel] = useState('gpt-4o')
  const [imageModel, setImageModel] = useState('gpt-image-2')
  const [imageSize, setImageSize] = useState('1024x1024')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)

  const [textMessages, setTextMessages] = useState<TextMessage[]>([])
  const [imageMessages, setImageMessages] = useState<ImageMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // 图生图上传
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string; base64: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [textMessages, imageMessages, loading])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('请上传图片文件'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('图片不能超过10MB'); return }
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setUploadedImage({ file, preview: dataUrl, base64 })
    }
    reader.readAsDataURL(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    if (!token) { toast.error('请先登录'); return }
    const content = input.trim()
    setInput('')

    if (mode === 'text') {
      await sendTextMessage(content)
    } else {
      await sendImageMessage(content)
    }
  }

  async function sendTextMessage(content: string) {
    const newMsg: TextMessage = { role: 'user', content, timestamp: new Date() }
    const updatedMessages = [...textMessages, newMsg]
    setTextMessages(updatedMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/chat/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          model: textModel,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTextMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: new Date() }])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '请求失败')
      setTextMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  async function sendImageMessage(content: string) {
    const hasImage = !!uploadedImage
    const userMsg: ImageMessage = {
      role: 'user',
      content,
      inputImageUrl: uploadedImage?.preview,
      timestamp: new Date(),
    }
    setImageMessages(prev => [...prev, userMsg])
    const imageBase64 = uploadedImage?.base64
    const imageMediaType = uploadedImage?.file.type
    setUploadedImage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/chat/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          prompt: content,
          size: imageSize,
          model: imageModel,
          imageBase64: hasImage ? imageBase64 : undefined,
          imageMediaType: hasImage ? imageMediaType : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImageMessages(prev => [...prev, {
        role: 'assistant',
        content: '图片生成完成',
        imageUrl: data.url,
        timestamp: new Date(),
      }])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  function clearHistory() {
    if (mode === 'text') setTextMessages([])
    else { setImageMessages([]); setUploadedImage(null) }
  }

  const currentMessages = mode === 'text' ? textMessages : imageMessages
  const currentTextModel = TEXT_MODELS.find(m => m.id === textModel)
  const currentImageModel = IMAGE_MODELS.find(m => m.id === imageModel)
  const currentModel = mode === 'text' ? currentTextModel : currentImageModel

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border bg-white flex-shrink-0">
        <div className="flex gap-1 bg-brand-bg rounded-xl p-1">
          <button onClick={() => setMode('text')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === 'text' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}>
            <MessageSquare className="w-4 h-4" />文字对话
          </button>
          <button onClick={() => { setMode('image'); setUploadedImage(null) }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === 'image' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}>
            <Image className="w-4 h-4" />AI 生图
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* 模型选择 */}
          <div className="relative">
            <button onClick={() => { setShowModelPicker(!showModelPicker); setShowSizePicker(false) }}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg border border-brand-border rounded-xl text-sm hover:border-brand-green transition-colors">
              <span className="font-medium text-brand-text">{currentModel?.name}</span>
              <span className="text-xs text-brand-muted hidden sm:block">{currentModel?.desc}</span>
              <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
            </button>
            {showModelPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-brand-border rounded-2xl shadow-lg z-20 w-56 overflow-hidden">
                {(mode === 'text' ? TEXT_MODELS : IMAGE_MODELS).map(m => {
                  const selected = mode === 'text' ? textModel === m.id : imageModel === m.id
                  return (
                    <button key={m.id} onClick={() => { mode === 'text' ? setTextModel(m.id) : setImageModel(m.id); setShowModelPicker(false) }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors ${selected ? 'bg-brand-bg' : ''}`}>
                      <span className={`font-medium ${selected ? 'text-brand-green-dark' : 'text-brand-text'}`}>{m.name}</span>
                      <span className="text-xs text-brand-muted">{m.desc}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 图片尺寸（仅生图模式） */}
          {mode === 'image' && (
            <div className="relative">
              <button onClick={() => { setShowSizePicker(!showSizePicker); setShowModelPicker(false) }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg border border-brand-border rounded-xl text-sm hover:border-brand-green transition-colors">
                <span className="text-brand-text">{IMAGE_SIZES.find(s => s.id === imageSize)?.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
              </button>
              {showSizePicker && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-brand-border rounded-2xl shadow-lg z-20 w-36 overflow-hidden">
                  {IMAGE_SIZES.map(s => (
                    <button key={s.id} onClick={() => { setImageSize(s.id); setShowSizePicker(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors ${imageSize === s.id ? 'text-brand-green-dark font-medium bg-brand-bg' : 'text-brand-text'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentMessages.length > 0 && (
            <button onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-brand-muted hover:text-red-400 transition-colors px-2 py-1.5">
              <Trash2 className="w-3.5 h-3.5" />清空
            </button>
          )}
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-4" onClick={() => { setShowModelPicker(false); setShowSizePicker(false) }}>
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">{mode === 'text' ? '💬' : '🎨'}</div>
            <p className="text-brand-text font-medium mb-2">
              {mode === 'text' ? `开始与 ${currentModel?.name} 对话` : '文生图 或 上传图片图生图'}
            </p>
            <p className="text-brand-muted text-sm max-w-sm">
              {mode === 'text'
                ? '可以问任何问题，帮你写文案、分析数据、头脑风暴…'
                : '纯文字描述 → 文生图；上传图片+描述 → 图生图精修'}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-md">
              {mode === 'text'
                ? ['帮我写一条朋友圈文案，推广牛油果沙拉', '给莱珂珍妮写一个品牌故事', '分析一下轻食餐饮的目标人群', '帮我想5个吸引大学生的营销活动']
                : ['清新轻食沙拉，白色大理石背景，自然光', '莱珂珍妮品牌海报，绿色清新风格', '牛油果沙拉俯拍，Instagram风格', '健康轻食餐厅室内场景，ins风']
              }.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="text-left text-xs text-brand-muted border border-brand-border rounded-xl px-3 py-2 hover:border-brand-green hover:text-brand-green-dark transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {mode === 'text' && textMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-0.5">AI</div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-brand-orange text-white rounded-tr-sm' : 'bg-white border border-brand-border text-brand-text rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {mode === 'image' && imageMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-1">AI</div>
                )}
                {msg.role === 'user' ? (
                  <div className="max-w-[75%] space-y-2">
                    {msg.inputImageUrl && (
                      <div className="flex justify-end">
                        <img src={msg.inputImageUrl} alt="上传图片" className="max-h-40 rounded-xl border border-brand-border" />
                      </div>
                    )}
                    <div className="bg-brand-orange text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
                      {msg.content}
                    </div>
                    {msg.inputImageUrl && (
                      <p className="text-xs text-right text-brand-muted">图生图模式</p>
                    )}
                  </div>
                ) : msg.imageUrl ? (
                  <div className="space-y-2">
                    <img src={msg.imageUrl} alt="生成图片" className="max-w-sm rounded-2xl border border-brand-border shadow-sm" />
                    <a href={msg.imageUrl} download={`生成图片_${Date.now()}.jpg`}
                      className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-green-dark transition-colors">
                      <Download className="w-3.5 h-3.5" />下载图片
                    </a>
                  </div>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">AI</div>
                <div className="bg-white border border-brand-border rounded-2xl rounded-tl-sm px-4 py-3">
                  {mode === 'text' ? (
                    <div className="flex gap-1 items-center">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-brand-muted rounded-full"
                          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
                      生成中，约需 60-90 秒…
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="px-6 py-4 border-t border-brand-border bg-white flex-shrink-0"
        onClick={() => { setShowModelPicker(false); setShowSizePicker(false) }}>
        <div className="max-w-3xl mx-auto space-y-2">
          {/* 图片上传预览（仅生图模式） */}
          {mode === 'image' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {uploadedImage ? (
                <div className="flex items-center gap-3 bg-brand-bg rounded-xl px-3 py-2 border border-brand-border">
                  <img src={uploadedImage.preview} alt="" className="w-12 h-12 rounded-lg object-cover border border-brand-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-text truncate">{uploadedImage.file.name}</p>
                    <p className="text-xs text-brand-green-dark">图生图模式 · 将对此图进行修改</p>
                  </div>
                  <button onClick={() => setUploadedImage(null)} className="text-brand-muted hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed text-sm transition-all ${dragging ? 'border-brand-green bg-emerald-50 text-brand-green-dark' : 'border-brand-border text-brand-muted hover:border-brand-green hover:text-brand-green-dark'}`}>
                  <Upload className="w-4 h-4" />
                  <span>上传参考图（可选）· 有图→图生图，无图→文生图</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {/* 文字输入框 */}
          <div className="flex gap-3 items-end bg-brand-bg border border-brand-border rounded-2xl px-4 py-3 focus-within:border-brand-green transition-colors">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'text' ? '输入消息，Enter 发送，Shift+Enter 换行…' : uploadedImage ? '描述你想如何修改这张图…' : '描述你想生成的图片…'}
              rows={1}
              className="flex-1 bg-transparent text-brand-text text-sm outline-none resize-none placeholder-brand-muted leading-relaxed"
              style={{ maxHeight: 120 }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button onClick={handleSend} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl bg-brand-orange flex items-center justify-center text-white hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-brand-muted text-center">
            {mode === 'text'
              ? `${currentModel?.name} · Enter 发送`
              : `${currentModel?.name} · ${IMAGE_SIZES.find(s => s.id === imageSize)?.label} · ${uploadedImage ? '图生图' : '文生图'}`}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
