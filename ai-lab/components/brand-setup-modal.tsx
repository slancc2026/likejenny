'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { X } from 'lucide-react'

const CUISINE_TYPES = [
  { value: 'light_food', label: '轻食健康', emoji: '🥗', desc: '沙拉、轻食、健康餐' },
  { value: 'cafe', label: '咖啡茶饮', emoji: '☕', desc: '咖啡、奶茶、饮品' },
  { value: 'hotpot', label: '火锅烤肉', emoji: '🔥', desc: '火锅、烤肉、串串' },
  { value: 'chinese', label: '中式正餐', emoji: '🍜', desc: '中餐、快餐、家常菜' },
  { value: 'fastfood', label: '快餐小吃', emoji: '🍱', desc: '小吃、外卖、快餐' },
]

interface Props {
  userId: string
  onComplete: (brand: { brand_name: string; cuisine_type: string }) => void
}

export function BrandSetupModal({ userId, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [brandName, setBrandName] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  const [mainDishes, setMainDishes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!brandName.trim()) { toast.error('请填写品牌名称'); return }
    if (!cuisineType) { toast.error('请选择餐饮类型'); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const cat = CUISINE_TYPES.find(c => c.value === cuisineType)!
      const colorMap: Record<string, object> = {
        light_food: { primary: '#A8D8A8', secondary: '#FFF8F0', accent: '#F4A261' },
        cafe:       { primary: '#6F4E37', secondary: '#F5F0EB', accent: '#A8D8A8' },
        hotpot:     { primary: '#E63946', secondary: '#FFF3E0', accent: '#FF6B35' },
        chinese:    { primary: '#8B1A1A', secondary: '#FFF8F0', accent: '#D4AF37' },
        fastfood:   { primary: '#FF6B35', secondary: '#FFFFFF', accent: '#FFD700' },
      }

      const { error } = await supabase.from('brand_profiles').upsert({
        user_id: userId,
        brand_name: brandName.trim(),
        brand_name_en: '',
        cuisine_type: cuisineType,
        style_preference: cat.value === 'light_food' ? '清新ins风' : cat.value === 'cafe' ? '精致文艺' : cat.value === 'hotpot' ? '热烈氛围' : cat.value === 'chinese' ? '传统国风' : '活力快潮',
        target_customer: cat.value === 'light_food' ? '大学生女生' : '年轻白领',
        main_dishes: mainDishes.trim() || cat.label,
        color_palette: colorMap[cuisineType],
        slogan: '',
        is_default: true,
      }, { onConflict: 'user_id' })

      if (error) throw error
      toast.success('品牌档案已设置！')
      onComplete({ brand_name: brandName.trim(), cuisine_type: cuisineType })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-white w-full max-w-md border-[2px] border-brand-black">
        {/* 头部 */}
        <div className="bg-brand-black px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold tracking-[0.3em] text-brand-green uppercase">STEP {step} / 2</div>
            <div className="font-display text-2xl text-white tracking-wide">
              {step === 1 ? '告诉我你的品牌' : '主打菜品（选填）'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className={`w-8 h-1.5 ${step >= 1 ? 'bg-brand-green' : 'bg-gray-600'}`} />
              <div className={`w-8 h-1.5 ${step >= 2 ? 'bg-brand-green' : 'bg-gray-600'}`} />
            </div>
            <button
              onClick={() => onComplete({ brand_name: '', cuisine_type: '' })}
              className="text-gray-500 hover:text-white transition-colors ml-2"
              title="跳过，稍后在品牌档案中设置"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-5">
              {/* 品牌名 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase">品牌名称 *</label>
                  <div className="group relative">
                    <span className="w-4 h-4 flex items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-400 cursor-help">?</span>
                    <div className="absolute left-5 -top-1 w-52 bg-brand-black text-white text-[10px] rounded px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none leading-relaxed">
                      会出现在海报、菜单、LOGO、包装上的品牌署名
                    </div>
                  </div>
                </div>
                <input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="如：莱珂珍妮"
                  maxLength={20}
                  className="w-full px-4 py-3 border-[2px] border-brand-black bg-white text-sm font-medium outline-none focus:border-brand-green transition-colors"
                />
                <p className="text-[10px] text-gray-400 mt-1">最多20字，建议品牌中文名</p>
              </div>

              {/* 餐饮类型 */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase">餐饮类型 *</label>
                  <div className="group relative">
                    <span className="w-4 h-4 flex items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-400 cursor-help">?</span>
                    <div className="absolute left-5 -top-1 w-52 bg-brand-black text-white text-[10px] rounded px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none leading-relaxed">
                      影响 AI 的图像风格和构图偏好，轻食和火锅的美学完全不同
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {CUISINE_TYPES.map(ct => (
                    <button
                      key={ct.value}
                      onClick={() => setCuisineType(ct.value)}
                      className={`flex items-center gap-3 px-4 py-3 border-[2px] text-left transition-all ${
                        cuisineType === ct.value
                          ? 'border-brand-black bg-brand-black text-white'
                          : 'border-brand-gray hover:border-brand-black bg-white'
                      }`}
                    >
                      <span className="text-xl">{ct.emoji}</span>
                      <div>
                        <div className="font-bold text-sm">{ct.label}</div>
                        <div className={`text-[10px] ${cuisineType === ct.value ? 'text-gray-300' : 'text-gray-400'}`}>{ct.desc}</div>
                      </div>
                      {cuisineType === ct.value && (
                        <div className="ml-auto w-5 h-5 bg-brand-green flex items-center justify-center text-brand-black text-xs font-black">✓</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (!brandName.trim()) { toast.error('请填写品牌名称'); return }
                  if (!cuisineType) { toast.error('请选择餐饮类型'); return }
                  setStep(2)
                }}
                className="w-full bg-brand-black text-white py-3.5 text-sm font-bold tracking-wider border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors"
              >
                下一步 →
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-xs font-bold tracking-wider uppercase">主打菜品</label>
                  <div className="group relative">
                    <span className="w-4 h-4 flex items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-400 cursor-help">?</span>
                    <div className="absolute left-5 -top-1 w-52 bg-brand-black text-white text-[10px] rounded px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none leading-relaxed">
                      包装物料和一键全套会优先展示这些菜品，帮助AI生成更贴合的内容
                    </div>
                  </div>
                </div>
                <textarea
                  value={mainDishes}
                  onChange={e => setMainDishes(e.target.value)}
                  placeholder="如：牛油果沙拉、鸡胸肉沙拉、低卡三明治..."
                  rows={3}
                  className="w-full px-4 py-3 border-[2px] border-brand-black bg-white text-sm font-medium outline-none focus:border-brand-green transition-colors resize-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">用顿号或逗号分隔，最多填5个</p>
              </div>

              <div className="border-[2px] border-brand-green bg-green-50 px-4 py-3">
                <p className="text-xs font-bold text-brand-green mb-1">设置完成后你将获得：</p>
                <div className="text-[10px] text-gray-500 space-y-0.5">
                  <div>· 海报、菜单、LOGO 自动带入品牌名「{brandName}」</div>
                  <div>· AI 风格自动匹配{CUISINE_TYPES.find(c=>c.value===cuisineType)?.label}品类调性</div>
                  <div>· 可随时在「品牌档案」中修改</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-[2px] border-brand-black text-sm font-bold hover:bg-brand-gray transition-colors"
                >
                  ← 上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-2 flex-grow-[2] bg-brand-green border-[2px] border-brand-black text-brand-black py-3 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-40"
                >
                  {loading ? '保存中…' : '完成设置 →'}
                </button>
              </div>
              <button
                onClick={() => onComplete({ brand_name: '', cuisine_type: '' })}
                className="w-full text-center text-xs text-gray-400 hover:text-brand-black transition-colors py-2"
              >
                跳过，稍后在「品牌档案」中设置
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  )
}
