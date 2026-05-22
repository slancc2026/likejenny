'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download } from 'lucide-react'

interface Asset { url: string; taskType: string; createdAt: string }
const LABELS: Record<string, string> = { enhance:'菜品精修',poster:'宣传海报',menu:'菜单设计',logo:'品牌LOGO',packaging:'包装物料',bundle:'一键全套' }

export default function AssetsPage() {
  const [images, setImages] = useState<Asset[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: tasks } = await supabase.from('tasks').select('task_type,output_urls,created_at')
        .eq('user_id', data.session.user.id).eq('status', 'done').not('output_urls', 'is', null)
        .order('created_at', { ascending: false }).limit(60)
      if (tasks) setImages(tasks.flatMap((t: { task_type: string; output_urls: string[]; created_at: string }) =>
        (t.output_urls || []).map((url: string) => ({ url, taskType: t.task_type, createdAt: t.created_at }))
      ))
    })
  }, [])

  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide mb-1">素材库</h1>
        <p className="text-gray-400 text-sm">共 {images.length} 张已生成图片</p>
      </div>
      {images.length === 0 ? (
        <div className="border-[2px] border-brand-black flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <p className="font-bold">还没有生成过素材</p>
          <p className="text-sm text-gray-400 mt-1">去创作工具生成你的第一张图吧</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }} className="border-[2px] border-brand-black">
          {images.map((img, i) => (
            <div key={i} className="border-r-[2px] border-b-[2px] border-brand-black group relative">
              <img src={img.url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a href={img.url} download={`${LABELS[img.taskType]}_${i}.jpg`}
                  className="flex items-center gap-1.5 bg-brand-white text-brand-black text-xs px-3 py-2 font-bold border-[2px] border-brand-white hover:bg-brand-green transition-colors">
                  <Download className="w-3.5 h-3.5" />下载
                </a>
              </div>
              <div className="p-3 border-t-[2px] border-brand-black">
                <p className="text-xs font-bold">{LABELS[img.taskType] || img.taskType}</p>
                <p className="text-[10px] text-gray-400 font-mono">{new Date(img.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
