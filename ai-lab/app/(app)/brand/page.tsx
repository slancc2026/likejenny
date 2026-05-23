'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Info } from 'lucide-react'

const CUISINE_TYPES = [
  { value: 'light_food', label: '轻食健康', emoji: '🥗' },
  { value: 'cafe',       label: '咖啡茶饮', emoji: '☕' },
  { value: 'hotpot',     label: '火锅烤肉', emoji: '🔥' },
  { value: 'chinese',    label: '中式正餐', emoji: '🍜' },
  { value: 'fastfood',   label: '快餐小吃', emoji: '🍱' },
]

const STYLE_OPTIONS = [
  { value: '清新ins风',  label: '清新ins风',  desc: '白色背景，自然光，ins感' },
  { value: '精致文艺',  label: '精致文艺',  desc: '莫兰迪色，克制留白，质感' },
  { value: '热烈氛围',  label: '热烈氛围',  desc: '暖色调，活力感，聚会欢乐' },
  { value: '传统国风',  label: '传统国风',  desc: '国潮元素，水墨，文化底蕴' },
  { value: '活力快潮',  label: '活力快潮',  desc: '鲜艳色彩，年轻潮流，冲击力' },
  { value: '极简高端',  label: '极简高端',  desc: '黑白灰，大留白，商务感' },
]

interface TipProps { text: string }
function Tip({ text }: TipProps) {
  return (
    <div className="group relative inline-block ml-1.5">
      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help inline" />
      <div className="absolute left-5 -top-1 w-56 bg-brand-black text-white text-[10px] rounded px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none leading-relaxed whitespace-normal">
        {text}
      </div>
    </div>
  )
}

const inputCls = "w-full px-4 py-2.5 border-[2px] border-brand-black bg-white text-sm font-medium outline-none focus:border-brand-green transition-colors"

export default function BrandPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [form, setForm] = useState({
    brand_name: '',
    brand_name_en: '',
    cuisine_type: 'light_food',
    style_preference: '清新ins风',
    target_customer: '大学生女生',
    main_dishes: '',
    slogan: '',
    primary_color: '#A8D8A8',
    secondary_color: '#FFF8F0',
    accent_color: '#F4A261',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', data.session.user.id)
        .single()

      if (brand) {
        setHasProfile(true)
        setForm({
          brand_name: brand.brand_name || '',
          brand_name_en: brand.brand_name_en || '',
          cuisine_type: brand.cuisine_type || 'light_food',
          style_preference: brand.style_preference || '清新ins风',
          target_customer: brand.target_customer || '大学生女生',
          main_dishes: brand.main_dishes || '',
          slogan: brand.slogan || '',
          primary_color: brand.color_palette?.primary || '#A8D8A8',
          secondary_color: brand.color_palette?.secondary || '#FFF8F0',
          accent_color: brand.color_palette?.accent || '#F4A261',
        })
      }
      setLoading(false)
    })
  }, [])

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSave() {
    if (!form.brand_name.trim()) { toast.error('品牌名称不能为空'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('未登录')

      const { error } = await supabase.from('brand_profiles').upsert({
        user_id: user.id,
        brand_name: form.brand_name.trim(),
        brand_name_en: form.brand_name_en.trim(),
        cuisine_type: form.cuisine_type,
        style_preference: form.style_preference,
        target_customer: form.target_customer.trim(),
        main_dishes: form.main_dishes.trim(),
        slogan: form.slogan.trim(),
        color_palette: {
          primary: form.primary_color,
          secondary: form.secondary_color,
          accent: form.accent_color,
        },
        is_default: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (error) throw error
      setHasProfile(true)
      toast.success('品牌档案已保存！所有创作工具将自动使用此信息')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="border-[2px] border-brand-black px-8 py-4 font-display text-xl tracking-widest animate-pulse">加载中…</div>
    </div>
  )

  return (
    <div className="p-4 md:p-7 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide mb-1">品牌档案</h1>
        <p className="text-gray-400 text-sm">
          {hasProfile ? '你的品牌信息会自动用于所有 AI 创作，随时可以修改' : '设置后所有创作工具将自动带入品牌信息'}
        </p>
      </div>

      {/* 核心信息 */}
      <div className="border-[2px] border-brand-black mb-5">
        <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase bg-brand-black text-white">
          核心信息 · 必填
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              品牌名称 *
              <Tip text="会出现在海报、菜单、LOGO、包装上的品牌署名，AI 会严格按此文字渲染" />
            </label>
            <input value={form.brand_name} onChange={e => set('brand_name', e.target.value)}
              placeholder="如：莱珂珍妮" maxLength={20} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              品牌英文名
              <Tip text="出现在菜单副标题、LOGO英文字体部分" />
            </label>
            <input value={form.brand_name_en} onChange={e => set('brand_name_en', e.target.value)}
              placeholder="如：LikeJenny" maxLength={30} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              餐饮类型 *
              <Tip text="影响 AI 的图像风格和构图偏好，轻食和火锅的美学完全不同" />
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CUISINE_TYPES.map(ct => (
                <button key={ct.value} onClick={() => set('cuisine_type', ct.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 border-[2px] text-sm font-bold transition-all ${
                    form.cuisine_type === ct.value
                      ? 'bg-brand-black text-white border-brand-black'
                      : 'border-brand-gray hover:border-brand-black bg-white'
                  }`}>
                  <span>{ct.emoji}</span>{ct.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 风格偏好 */}
      <div className="border-[2px] border-brand-black mb-5">
        <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">
          风格偏好
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              品牌风格
              <Tip text="影响所有生成内容的视觉调性，是最重要的风格参数" />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {STYLE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => set('style_preference', s.value)}
                  className={`text-left px-4 py-3 border-[2px] transition-all ${
                    form.style_preference === s.value
                      ? 'bg-brand-black text-white border-brand-black'
                      : 'border-brand-gray hover:border-brand-black bg-white'
                  }`}>
                  <div className="font-bold text-sm">{s.label}</div>
                  <div className={`text-[10px] mt-0.5 ${form.style_preference === s.value ? 'text-gray-300' : 'text-gray-400'}`}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              目标客群
              <Tip text="影响海报的视觉语言，「大学生女生」和「商务人士」的海报风格截然不同" />
            </label>
            <input value={form.target_customer} onChange={e => set('target_customer', e.target.value)}
              placeholder="如：大学生女生、白领、家庭聚餐" maxLength={30} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              品牌 Slogan
              <Tip text="出现在菜单底部、包装物料、海报角落" />
            </label>
            <input value={form.slogan} onChange={e => set('slogan', e.target.value)}
              placeholder="如：新鲜每一天，轻盈好生活" maxLength={30} className={inputCls} />
          </div>
        </div>
      </div>

      {/* 菜品信息 */}
      <div className="border-[2px] border-brand-black mb-5">
        <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">
          菜品信息
        </div>
        <div className="p-5">
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase mb-1.5">
              主打菜品
              <Tip text="包装物料和一键全套会优先展示这些菜品，帮助AI生成更贴合的内容" />
            </label>
            <textarea value={form.main_dishes} onChange={e => set('main_dishes', e.target.value)}
              placeholder="如：牛油果沙拉、鸡胸肉沙拉、低卡三明治、健康果汁"
              rows={2}
              className={inputCls + ' resize-none'} />
            <p className="text-[10px] text-gray-400 mt-1">用顿号或逗号分隔，最多填5个</p>
          </div>
        </div>
      </div>

      {/* 品牌主色 */}
      <div className="border-[2px] border-brand-black mb-6">
        <div className="px-5 py-3 border-b-[2px] border-brand-black font-bold text-xs tracking-widest uppercase">
          品牌配色
          <Tip text="影响菜单、海报、LOGO、包装的整体配色方向，AI 会以此为参考生成相近色调" />
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'primary_color', label: '主色', tip: '品牌最核心的颜色' },
              { key: 'secondary_color', label: '辅助色', tip: '背景或辅助区域的颜色' },
              { key: 'accent_color', label: '点缀色', tip: '价格标签、按钮等强调色' },
            ].map(({ key, label }) => (
              <div key={key} className="text-center">
                <div className="relative mx-auto mb-2" style={{ width: 56, height: 56 }}>
                  <div className="w-14 h-14 border-[2px] border-brand-black" style={{ background: (form as Record<string,string>)[key] }} />
                  <input type="color" value={(form as Record<string,string>)[key]}
                    onChange={e => set(key, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">{label}</div>
                <div className="text-[9px] text-gray-400 font-mono">{(form as Record<string,string>)[key]}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">点击色块可更换颜色</p>
        </div>
      </div>

      {/* 保存按钮 */}
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-brand-black text-white py-4 text-sm font-bold tracking-wider border-[2px] border-brand-black hover:bg-brand-green hover:text-brand-black transition-colors disabled:opacity-40">
        {saving ? '保存中…' : hasProfile ? '更新品牌档案 →' : '保存品牌档案 →'}
      </button>

      {hasProfile && (
        <p className="text-center text-[10px] text-gray-400 mt-3">
          已保存 · 所有创作工具将自动使用以上信息
        </p>
      )}
    </div>
  )
}
