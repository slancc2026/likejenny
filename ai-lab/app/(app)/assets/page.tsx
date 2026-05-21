import { createClient } from '@/lib/supabase/server'
import { TASK_LABELS, TaskType } from '@/types'
import { Download } from 'lucide-react'

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, task_type, status, output_urls, created_at, credits_cost')
    .eq('user_id', user!.id)
    .eq('status', 'done')
    .not('output_urls', 'is', null)
    .order('created_at', { ascending: false })
    .limit(60)

  const allImages = tasks?.flatMap(task =>
    (task.output_urls as string[]).map((url: string) => ({
      url,
      taskType: task.task_type as TaskType,
      createdAt: task.created_at,
      taskId: task.id,
    }))
  ) || []

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-brand-text mb-1">素材库</h1>
        <p className="text-brand-muted text-sm">共 {allImages.length} 张已生成图片</p>
      </div>

      {allImages.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🗂️</div>
          <p className="text-brand-muted">还没有生成过素材，去创作工具试试吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {allImages.map((img, i) => (
            <div key={i} className="group relative bg-white rounded-2xl border border-brand-border overflow-hidden">
              <img src={img.url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a
                  href={img.url}
                  download={`${TASK_LABELS[img.taskType]}_${i}.jpg`}
                  className="flex items-center gap-1.5 bg-white text-brand-text text-xs px-3 py-2 rounded-full font-medium"
                >
                  <Download className="w-3.5 h-3.5" />下载
                </a>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-brand-text">{TASK_LABELS[img.taskType]}</p>
                <p className="text-[10px] text-brand-muted">{new Date(img.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
