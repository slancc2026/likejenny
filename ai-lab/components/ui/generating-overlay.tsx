'use client'
import { useEffect, useState } from 'react'

interface GeneratingOverlayProps {
  taskType?: string
  estimatedSeconds?: number
}

const TIPS = [
  'AI 正在分析图片，请稍候…',
  '正在优化光线和色彩…',
  '快好了！正在进行最后处理…',
  '可以先整理一下其他素材…',
  '品质优先，稍等片刻～',
]

export function GeneratingOverlay({ estimatedSeconds = 90 }: GeneratingOverlayProps) {
  const [elapsed, setElapsed] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const t1 = setInterval(() => setElapsed(s => s + 1), 1000)
    const t2 = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 4000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  const progress = Math.min((elapsed / estimatedSeconds) * 100, 92)

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 border-[2px] border-brand-black flex items-center justify-center mb-6 relative">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
          <rect x="2" y="2" width="76" height="76" fill="none" stroke="#E8E8E4" strokeWidth="2"/>
          <rect x="2" y="2" width="76" height="76" fill="none" stroke="#0A0A0A" strokeWidth="2"
            strokeDasharray="288"
            strokeDashoffset={`${288 * (1 - progress / 100)}`}
            style={{ transition: 'stroke-dashoffset 1s ease' }}/>
        </svg>
        <span className="font-display text-2xl relative z-10">{Math.round(progress)}%</span>
      </div>

      <div className="flex gap-1 mb-5">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="w-1 h-5 bg-brand-black"
            style={{ animation: `bwave 1.2s ease-in-out ${i*0.15}s infinite`, opacity: 0.3 }} />
        ))}
      </div>

      <p className="font-bold text-sm mb-1">AI 生成中</p>
      <p className="text-brand-gray-2 text-xs mb-4">{TIPS[tipIndex]}</p>
      <div className="border-[2px] border-brand-black px-4 py-1.5 font-mono text-xs">
        {elapsed}s / ~{estimatedSeconds}s
      </div>

      <style jsx>{`
        @keyframes bwave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
