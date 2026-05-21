'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { GeneratingOverlay } from '@/components/ui/generating-overlay'

interface DishItem { name: string; price: string }
interface Category { name: string; items: DishItem[] }

const DEFAULT_CATEGORIES: Category[] = [
  { name: '沙拉', items: [{ name: '牛油果沙拉', price: '28' }, { name: '尼斯沙拉', price: '26' }] },
  { name: '主食', items: [{ name: '藜麦饭', price: '18' }] },
  { name: '饮品', items: [{ name: '玫瑰气泡水', price: '12' }] },
]

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  function addCategory() {
    setCategories([...categories, { name: '新分类', items: [{ name: '', price: '' }] }])
  }
  function updateCategoryName(ci: number, name: string) {
    const c = [...categories]; c[ci] = { ...c[ci], name }; setCategories(c)
  }
  function addItem(ci: number) {
    const c = [...categories]; c[ci].items.push({ name: '', price: '' }); setCategories(c)
  }
  function updateItem(ci: number, ii: number, field: 'name' | 'price', val: string) {
    const c = [...categories]; c[ci].items[ii][field] = val; setCategories(c)
  }
  function removeItem(ci: number, ii: number) {
    const c = [...categories]; c[ci].items.splice(ii, 1); setCategories(c)
  }

  function formatDishes(): string {
    return categories.map(cat =>
      `【${cat.name}】\n` + cat.items.filter(i => i.name).map(i => `  ${i.name} ¥${i.price}`).join('\n')
    ).join('\n\n')
  }

  async function handleGenerate() {
    const dishes = formatDishes()
    if (!dishes.trim()) { toast.error('请先添加菜品'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.url)
      toast.success('菜单生成完成！')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">菜单设计</h1>
        <p className="text-brand-muted text-sm">AI 生成印刷级 A4 菜单 · 消耗 8 积分</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* 菜品编辑 */}
        <div className="col-span-3 space-y-4">
          {categories.map((cat, ci) => (
            <Card key={ci}>
              <CardHeader>
                <input
                  value={cat.name}
                  onChange={e => updateCategoryName(ci, e.target.value)}
                  className="font-medium text-brand-text text-sm bg-transparent outline-none border-b border-transparent focus:border-brand-green"
                />
              </CardHeader>
              <CardBody className="space-y-2">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex gap-2 items-center">
                    <input value={item.name} onChange={e => updateItem(ci, ii, 'name', e.target.value)} placeholder="菜品名称"
                      className="flex-1 px-3 py-2 rounded-lg border border-brand-border text-sm outline-none focus:border-brand-green bg-white" />
                    <div className="flex items-center gap-1 bg-white border border-brand-border rounded-lg px-2.5 py-2">
                      <span className="text-brand-muted text-sm">¥</span>
                      <input value={item.price} onChange={e => updateItem(ci, ii, 'price', e.target.value)} placeholder="0"
                        className="w-14 text-sm outline-none text-brand-text" />
                    </div>
                    <button onClick={() => removeItem(ci, ii)} className="p-1.5 text-brand-muted hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={() => addItem(ci)}
                  className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-green-dark transition-colors mt-1">
                  <Plus className="w-3.5 h-3.5" />添加菜品
                </button>
              </CardBody>
            </Card>
          ))}
          <button onClick={addCategory}
            className="w-full py-3 border-2 border-dashed border-brand-border rounded-2xl text-sm text-brand-muted hover:border-brand-green hover:text-brand-green-dark transition-all">
            + 添加分类
          </button>
          <Button onClick={handleGenerate} loading={loading} disabled={loading} className="w-full" size="lg">
            生成菜单 · 8积分
          </Button>
        </div>

        {/* 预览 */}
        <div className="col-span-2">
          <Card className="sticky top-4">
            <CardHeader><p className="font-medium text-brand-text text-sm">生成结果</p></CardHeader>
            <CardBody>
              {loading ? (
                <GeneratingOverlay taskType="menu" estimatedSeconds={120} />
              ) : result ? (
                <div className="space-y-3">
                  <img src={result} alt="菜单" className="w-full rounded-xl border border-brand-border" />
                  <Button onClick={() => { const a = document.createElement('a'); a.href = result!; a.download = `菜单_${Date.now()}.jpg`; a.click() }}
                    variant="secondary" className="w-full gap-2">
                    <Download className="w-4 h-4" />下载菜单
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm text-brand-muted">编辑菜品后点击生成</p>
                  <p className="text-xs text-brand-muted mt-1">使用 high 质量，预计 90-120s</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
