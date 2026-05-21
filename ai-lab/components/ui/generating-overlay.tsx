'use client'
import { useEffect, useState } from 'react'

interface GeneratingOverlayProps {
  taskType: string
  estimatedSeconds?: number
}

const TIPS = [
  'AI 正在分析您的图片，请稍候…',
  '正在优化光线和色彩，这需要一点时间…',
  '快好了！AI 正在进行最后的精修…',
  '图片生成中，可以先整理一下其他素材…',
  '品质优先，稍等片刻，结果值得等待～',
]

export function GeneratingOverlay({ taskType, estimatedSeconds = 90 }: GeneratingOverlayProps) {
  const [elapsed, setElapsed] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000)
    const tipTimer = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 5000)
    return () => { clearInterval(timer); clearInterval(tipTimer) }
  }, [])

  const progress = Math.min((elapsed / estimatedSeconds) * 100, 92)

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {/* 旋转圆环 */}
      <div className="relative w-24 h-24 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#E7E2DC" strokeWidth="4" />
          <circle
            cx="48" cy="48" r="40" fill="none"
            stroke="#A8D8A8" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-medium text-brand-green-dark">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* 波纹动画 */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-1.5 h-6 bg-brand-green rounded-full"
            style={{ animation: `wave 1.2s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>

      <p className="text-brand-text font-medium mb-2">AI 生成中</p>
      <p className="text-brand-muted text-sm mb-6 transition-all duration-500">{TIPS[tipIndex]}</p>
      <p className="text-xs text-brand-muted">已用时 {elapsed}s / 预计 {estimatedSeconds}s</p>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
