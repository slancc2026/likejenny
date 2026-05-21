import { createClient } from '@/lib/supabase/server'
import { TaskType } from '@/types'

/** 将 base64 图片上传到 Supabase Storage，返回公开 URL */
export async function uploadGeneratedImage(
  userId: string,
  taskType: TaskType,
  taskId: string,
  base64: string,
  index: number = 0
): Promise<string> {
  const supabase = await createClient()

  const byteString = Buffer.from(base64, 'base64')
  const filePath = `${userId}/${taskType}/${taskId}/${index}.jpg`

  const { error } = await supabase.storage
    .from('generated-images')
    .upload(filePath, byteString, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw new Error(`上传失败: ${error.message}`)

  const { data } = supabase.storage.from('generated-images').getPublicUrl(filePath)
  return data.publicUrl
}
