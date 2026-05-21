'use client'
import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Upload, Download, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'

type CuisineType = 'light_food' | 'chinese'

export default function EnhancePage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cuisineType, setCuisineType] = useState<CuisineType>('light_food')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    if (!f.type.startsWith('image/')) { toast.error('请上传图片文件'); return }
    if (f.size > 10 * 1024 * 1024) { toast.error('图片不能超过10MB'); return }
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  async function handleEnhance() {
    if (!file || !preview) { toast.error('请先上传图片'); return }
    setLoading(true)
    try {
      // 提取 base64
      const base64 = preview.split(',')[1]
      const mediaType = file.type

      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, imageMediaType: mediaType, cuisineType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '生成失败')
      setResult(data.url)
      toast.success('精修完成！')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `精修图_${Date.now()}.jpg`
    a.click()
  }

  function handleReset() {
    setFile(null); setPreview(null); setResult(null)
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">菜品精修</h1>
        <p className="text-brand-muted text-sm">上传菜品原图，AI 自动提升质感 · 消耗 4 积分</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：上传区 */}
        <Card>
          <CardHeader>
            <p className="font-medium text-brand-text text-sm">上传原图</p>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* 菜品类型 */}
            <div>
              <p className="text-xs text-brand-muted mb-2">菜品类型</p>
              <div className="flex gap-2">
                {[
                  { value: 'light_food', label: '轻食/沙拉' },
                  { value: 'chinese', label: '中式菜品' },
                ] .map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCuisineType(opt.value as CuisineType)}
                    className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
                      cuisineType === opt.value
                        ? 'border-brand-green bg-emerald-50 text-brand-green-dark font-medium'
                        : 'border-brand-border text-brand-muted hover:border-brand-green'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 拖拽上传区 */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all overflow-hidden
                ${dragging ? 'border-brand-green bg-emerald-50' : 'border-brand-border hover:border-brand-green hover:bg-emerald-50/30'}`}
              style={{ minHeight: 240 }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {preview ? (
                <img src={preview} alt="原图" className="w-full h-full object-contain" style={{ maxHeight: 320 }} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-brand-muted" />
                  </div>
                  <p className="text-sm font-medium text-brand-text mb-1">点击或拖拽上传</p>
                  <p className="text-xs text-brand-muted">支持 JPG / PNG，最大 10MB</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleEnhance}
              disabled={!file || loading}
              loading={loading}
              className="w-full"
              size="lg"
            >
              {loading ? '精修中…' : '开始精修 · 4积分'}
            </Button>
          </CardBody>
        </Card>

        {/* 右侧：结果区 */}
        <Card>
          <CardHeader>
            <p className="font-medium text-brand-text text-sm">精修结果</p>
          </CardHeader>
          <CardBody>
            {loading ? (
              <GeneratingOverlay taskType="enhance" estimatedSeconds={90} />
            ) : result ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-brand-border">
                  <img src={result} alt="精修图" className="w-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} variant="secondary" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />
                    下载图片
                  </Button>
                  <Button onClick={handleReset} variant="ghost" size="md">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mb-3 text-2xl">🥗</div>
                <p className="text-sm text-brand-muted">精修结果将在这里显示</p>
                <p className="text-xs text-brand-muted mt-1">预计等待 60-90 秒</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 效果说明 */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { emoji: '💡', title: '光线优化', desc: '自动补光，模拟专业摄影棚效果' },
          { emoji: '🎨', title: '色彩增强', desc: '提升饱和度，让菜品更鲜艳诱人' },
          { emoji: '✨', title: '细节锐化', desc: '提升清晰度，展现菜品纹理质感' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-xl border border-brand-border p-4">
            <span className="text-xl">{item.emoji}</span>
            <p className="text-sm font-medium text-brand-text mt-2 mb-1">{item.title}</p>
            <p className="text-xs text-brand-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
