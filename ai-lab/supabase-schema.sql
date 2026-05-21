-- ====================================================
-- 莱珂珍妮 AI 实验室 · Supabase 建表 SQL
-- 在 Supabase Dashboard → SQL Editor 执行
-- ====================================================

-- 1. 用户扩展表（绑定 Supabase Auth）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  credits INT NOT NULL DEFAULT 20,
  total_used INT NOT NULL DEFAULT 0,
  last_daily_credit DATE,          -- 记录上次领取每日积分日期
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户注册后自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 品牌档案
CREATE TABLE IF NOT EXISTS brand_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_name VARCHAR(100) NOT NULL,
  brand_name_en VARCHAR(100),
  cuisine_type VARCHAR(50) DEFAULT 'light_food',
  style_preference VARCHAR(100) DEFAULT '清新ins风',
  target_customer VARCHAR(200) DEFAULT '大学生女生',
  main_dishes TEXT,
  color_palette JSONB DEFAULT '{"primary":"#A8D8A8","secondary":"#FFF8F0","accent":"#F4A261"}',
  slogan VARCHAR(200),
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 生成任务
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  task_type VARCHAR(50) NOT NULL,  -- enhance/poster/menu/logo/packaging/bundle
  status VARCHAR(20) DEFAULT 'pending',  -- pending/processing/done/failed
  input_data JSONB,
  output_urls JSONB,               -- 存储图片 URL 数组
  credits_cost INT DEFAULT 0,
  error_msg TEXT,
  progress INT DEFAULT 0,          -- 0-100
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 积分流水
CREATE TABLE IF NOT EXISTS credit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  amount INT NOT NULL,             -- 正数=增加，负数=消耗
  balance INT NOT NULL,            -- 操作后余额
  type VARCHAR(20) NOT NULL,       -- register/daily/consume/recharge
  description VARCHAR(200),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- RLS 行级安全策略
-- ====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_logs ENABLE ROW LEVEL SECURITY;

-- profiles: 只能读写自己的
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

-- brand_profiles: 只能读写自己的
CREATE POLICY "brand_profiles_self" ON brand_profiles
  FOR ALL USING (auth.uid() = user_id);

-- tasks: 只能读写自己的
CREATE POLICY "tasks_self" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- credit_logs: 只能读自己的（写通过服务端）
CREATE POLICY "credit_logs_read_self" ON credit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ====================================================
-- Storage: 创建 bucket（在 Dashboard 手动创建或执行）
-- ====================================================
-- Bucket 名称: generated-images（Public）
-- 路径规范: {user_id}/{task_type}/{task_id}/{n}.jpg
-- 在 Dashboard → Storage → New Bucket:
--   Name: generated-images
--   Public: true

-- ====================================================
-- 索引优化
-- ====================================================
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS credit_logs_user_id_idx ON credit_logs(user_id);
CREATE INDEX IF NOT EXISTS brand_profiles_user_id_idx ON brand_profiles(user_id);
