# 莱珂珍妮 AI 实验室

> 餐饮品牌 AI 视觉创作工具 · ai.shengyuanhong.cn

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **数据库 + 认证 + 存储**: Supabase
- **AI 图像**: 方舟平台 GPT Image 2（文生图 + 图生图）
- **AI 文案**: 阿里云百炼 qwen-plus
- **部署**: Vercel

---

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
# 填入你的 Supabase 和 API Key
```

### 3. 初始化 Supabase

在 [Supabase Dashboard](https://supabase.com) → SQL Editor 中执行 `supabase-schema.sql`

然后手动创建 Storage Bucket：
- Dashboard → Storage → New Bucket
- 名称：`generated-images`
- Public：✅ 开启

### 4. 启动开发服务器

```bash
npm run dev
# 访问 http://localhost:3000
```

---

## 部署到 Vercel

1. Push 代码到 GitHub
2. 在 Vercel 导入项目
3. 填入所有环境变量（参考 `.env.example`）
4. 部署完成，绑定域名 `ai.shengyuanhong.cn`

---

## 功能模块

| 功能 | 积分 | API | 说明 |
|------|------|-----|------|
| 菜品精修 | 4 | `/api/enhance` | 图生图，⚠️ 不传 negative_prompt |
| 宣传海报 | 5 | `/api/poster` | 文生图，支持4平台尺寸 |
| 菜单设计 | 8 | `/api/menu` | A4竖版，high quality |
| 品牌LOGO | 15 | `/api/logo` | 串行生成3套方案 |
| 包装物料 | 20 | `/api/packaging` | 品牌触点系统 |
| 一键全套 | 40 | 前端串行调用 | 8折优惠 |

---

## 用户系统

- 认证：Supabase Auth（邮箱+密码）
- 注册：默认关闭（`NEXT_PUBLIC_REGISTRATION_OPEN=false`）
- 建账号：Supabase Dashboard → Authentication → Users → Invite user
- 每日登录：+2积分（自动发放）
- 注册赠：20积分（trigger 自动写入）

---

## 重要注意事项

1. **图生图不支持 `negative_prompt`**：`/api/enhance` 中已确保不传此参数
2. **生成时长**：60-120 秒，前端有进度动画
3. **图片存储**：先上传 Supabase Storage → 再写 URL 到数据库，不存 base64
4. **品牌信息**：从数据库 `brand_profiles` 读取，用户可在后续版本中自定义

---

## 目录结构

```
├── app/
│   ├── (app)/              # 需登录的路由组
│   │   ├── layout.tsx      # 工作台布局（侧边栏+Header）
│   │   ├── dashboard/      # 工作台首页
│   │   ├── enhance/        # 菜品精修
│   │   ├── poster/         # 宣传海报
│   │   ├── menu/           # 菜单设计
│   │   ├── logo/           # 品牌LOGO
│   │   ├── packaging/      # 包装物料
│   │   ├── bundle/         # 一键全套
│   │   ├── assets/         # 素材库
│   │   └── credits/        # 积分中心
│   ├── api/                # API 路由
│   │   ├── enhance/        # 图生图
│   │   ├── poster/         # 海报生成
│   │   ├── menu/           # 菜单生成
│   │   ├── logo/           # LOGO生成
│   │   └── packaging/      # 包装物料
│   ├── login/              # 登录页
│   └── page.tsx            # 首页（Landing / 跳转）
├── components/
│   ├── ui/                 # 基础组件
│   └── layout/             # 布局组件
├── lib/
│   ├── ai.ts               # AI API 封装
│   ├── prompts.ts          # Prompt 模板
│   ├── credits.ts          # 积分操作
│   ├── storage.ts          # 图片上传
│   └── supabase/           # Supabase 客户端
├── types/                  # TypeScript 类型
├── supabase-schema.sql     # 建表 SQL
└── .env.example            # 环境变量模板
```

---

*© 2025 河南盛塬宏品牌管理有限责任公司*
