export interface Profile {
  id: string
  credits: number
  total_used: number
  last_daily_credit: string | null
  created_at: string
}

export interface BrandProfile {
  id: number
  user_id: string
  brand_name: string
  brand_name_en: string
  cuisine_type: string
  style_preference: string
  target_customer: string
  main_dishes: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
  }
  slogan: string
  is_default: boolean
  created_at: string
}

export type TaskType = 'enhance' | 'poster' | 'menu' | 'logo' | 'packaging' | 'bundle'
export type TaskStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Task {
  id: string
  user_id: string
  task_type: TaskType
  status: TaskStatus
  input_data: Record<string, unknown>
  output_urls: string[] | null
  credits_cost: number
  error_msg: string | null
  progress: number
  created_at: string
  updated_at: string
}

export interface CreditLog {
  id: number
  user_id: string
  amount: number
  balance: number
  type: 'register' | 'daily' | 'consume' | 'recharge'
  description: string
  task_id: string | null
  created_at: string
}

// 莱珂珍妮默认品牌预设（当用户没有自定义时的兜底）
export const LKJ_DEFAULT_BRAND: Omit<BrandProfile, 'id' | 'user_id' | 'created_at' | 'is_default'> = {
  brand_name: '莱珂珍妮',
  brand_name_en: 'LIKEJENNY LIGHT FOOD',
  cuisine_type: 'light_food',
  style_preference: '清新ins风',
  target_customer: '大学生女生',
  main_dishes: '牛油果沙拉',
  color_palette: { primary: '#A8D8A8', secondary: '#FFF8F0', accent: '#F4A261' },
  slogan: '新鲜每一天·轻盈好生活',
}

export const CREDITS_COST: Record<TaskType, number> = {
  enhance: 4,
  poster: 5,
  menu: 8,
  logo: 15,
  packaging: 20,
  bundle: 40,
}

export const TASK_LABELS: Record<TaskType, string> = {
  enhance: '菜品精修',
  poster: '宣传海报',
  menu: '菜单设计',
  logo: '品牌LOGO',
  packaging: '包装物料',
  bundle: '一键全套',
}
