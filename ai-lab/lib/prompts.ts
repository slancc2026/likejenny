// 品牌档案类型
export interface BrandProfile {
  brand_name: string
  brand_name_en?: string
  cuisine_type: string
  style_preference: string
  target_customer: string
  main_dishes?: string
  slogan?: string
  color_palette?: { primary: string; secondary: string; accent: string }
}

// 风格关键词映射（中文标签 → 英文关键词，提升 AI 响应精准度）
const STYLE_KEYWORDS: Record<string, string> = {
  '清新ins风':  'fresh, natural, ins-style, soft natural light, light colors, airy',
  '精致文艺':  'premium, artistic, muted tones, minimal, elegant, refined',
  '热烈氛围':  'vibrant, energetic, warm tones, bold, festive, lively',
  '传统国风':  'Chinese traditional, ink wash, cultural elements, heritage, elegant',
  '活力快潮':  'dynamic, youthful, vivid colors, trendy, energetic, street style',
  '极简高端':  'minimal, clean, white space, high-end, sophisticated, monochrome',
}

// ─── 菜品精修 ───────────────────────────────────────────────
export function enhancePrompt(cuisineType: string): string {
  const basePrompt = `将此菜品图转化为专业餐厅广告级食品摄影照片。

要求：
- 菜品放置在干净的大理石台面或原木餐桌上
- 专业摄影棚布光，主光源从左上方45°打入
- 浅景深，背景柔和虚化成美丽的bokeh
- 商业食品摄影质感，色彩鲜艳饱满有食欲感
- 移除凌乱背景，只保留菜品和干净的台面
- 高端餐厅菜单级别的视觉品质
- Remove cluttered background, no text, no watermark, no logo`

  if (cuisineType === 'hotpot' || cuisineType === 'chinese') {
    return basePrompt + `\n- 暖色调灯光，突出热气腾腾的氛围和食材丰富感`
  }
  return basePrompt + `\n- 清新自然光，突出食材的新鲜感和健康感`
}

// ─── 宣传海报 ───────────────────────────────────────────────
export function posterPrompt(
  brand: BrandProfile,
  params: {
    posterType: 'daily' | 'festival' | 'newproduct'
    platform: string
    dishName: string
    price: string
    festival?: string
    dishDesc?: string
    copyTitle?: string
  }
): string {
  const { brand_name, brand_name_en, cuisine_type, style_preference, slogan, color_palette } = brand
  const styleKw = STYLE_KEYWORDS[style_preference] || style_preference
  const primaryColor = color_palette?.primary || '#A8D8A8'
  const { dishName, price, platform, posterType } = params

  const platformMap: Record<string, string> = {
    wechat: '微信朋友圈，1:1正方形',
    xiaohongshu: '小红书封面，3:4竖版',
    douyin: '抖音视频封面，9:16竖版',
    meituan: '美团/饿了么主图，1:1正方形',
  }
  const platformDesc = platformMap[platform] || platform

  if (posterType === 'festival') {
    return `为「${brand_name}」生成一张${params.festival}节日营销海报，输出格式：${platformDesc}。

品牌信息：
- 品牌名：「${brand_name}」${brand_name_en ? `，英文名：「${brand_name_en}」` : ''}
- 品类：${cuisine_type === 'light_food' ? '轻食健康' : cuisine_type === 'cafe' ? '咖啡茶饮' : cuisine_type === 'hotpot' ? '火锅烤肉' : '餐饮品牌'}
- 品牌风格：${style_preference}（${styleKw}）
- 主色调：${primaryColor}${slogan ? `，Slogan：「${slogan}」` : ''}

节日主题：${params.festival}，节日氛围感强，色调与节日契合，节日元素自然融入，不俗气。

营销信息：
- 推广菜品：「${dishName}」
- 限时特价：¥${price}

画面构成：
- 主体：${dishName}专业食品摄影，占画面50%，食欲感强
- 上方：${params.festival}节日氛围装饰元素
- 中部：主标题大字「${params.copyTitle || params.festival + '特惠'}」
- 菜品名+价格：「${dishName}」¥${price}
- 品牌名：「${brand_name}」清晰显示${slogan ? `，底部小字Slogan「${slogan}」` : ''}

严格要求：品牌名「${brand_name}」文字100%准确，所有中文无错别字无乱码，不要在画面中随意添加图形LOGO。`
  }

  if (posterType === 'newproduct') {
    return `为「${brand_name}」生成一张新品上市宣传图，输出格式：${platformDesc}。

品牌信息：
- 品牌名：「${brand_name}」${brand_name_en ? `，英文名：「${brand_name_en}」` : ''}
- 品牌风格：${style_preference}（${styleKw}）
- 主色调：${primaryColor}${slogan ? `，Slogan：「${slogan}」` : ''}

新品信息：
- 新品名称：「${dishName}」
- 定价：¥${price}${params.dishDesc ? `\n- 产品特点：${params.dishDesc}` : ''}

画面构成：
- 主体：「${dishName}」专业食品摄影，NEW新品标签醒目，占画面55%
- 左上或右上：品牌名「${brand_name}」大字显示
- 主标题：「新品上市」或「${params.copyTitle || '新品来了'}」
- 价格标签：「¥${price}」突出显示
- ${slogan ? `底部Slogan：「${slogan}」` : '底部品牌名小字'}

视觉风格：${style_preference}，突出新品概念，视觉冲击力强，${styleKw}。

严格要求：品牌名「${brand_name}」文字100%准确，所有中文无错别字无乱码，不要随机生成图形LOGO。`
  }

  // 日常推广（默认）
  return `为「${brand_name}」生成一张日常宣传推广图，输出格式：${platformDesc}。

品牌身份：
- 品牌名：「${brand_name}」${brand_name_en ? `，英文名：「${brand_name_en}」` : ''}
- 品类：${cuisine_type === 'light_food' ? '轻食健康餐饮品牌' : cuisine_type === 'cafe' ? '精品咖啡/茶饮品牌' : cuisine_type === 'hotpot' ? '火锅/烤肉餐饮品牌' : '餐饮品牌'}
- 核心气质：${style_preference}，${styleKw}
- 品牌主色：${primaryColor}${slogan ? `\n- Slogan：「${slogan}」` : ''}

今日主推产品：
- 菜品：「${dishName}」
- 价格：¥${price}${params.dishDesc ? `\n- 特点：${params.dishDesc}` : ''}

画面构成：
- 主体：「${dishName}」专业食品摄影，自然光，精致摆盘，占画面55%，食欲感强
- 左上或右上：品牌名「${brand_name}」大字，颜色${primaryColor}
- 中部：主标题文案（10字内）${params.copyTitle ? `「${params.copyTitle}」` : ''}
- 价格标签：「¥${price}」醒目显示
- ${slogan ? `底部Slogan：「${slogan}」小字` : '底部品牌名小字'}

视觉要求：${style_preference}气质，商业级质感，食欲感强，适合${platformDesc.split('，')[0]}直接发布。

严格要求：品牌名「${brand_name}」文字100%准确，所有中文无错别字无乱码，不要在画面中随意生成图形LOGO或图案。`
}

// ─── 菜单设计 ───────────────────────────────────────────────
export function menuPrompt(
  brand: BrandProfile,
  dishes: Array<{ category: string; name: string; price: string; desc?: string }>,
  style: 'fresh' | 'chinese' | 'minimal' = 'fresh'
): string {
  const { brand_name, brand_name_en, slogan, color_palette } = brand
  const primary = color_palette?.primary || '#A8D8A8'
  const secondary = color_palette?.secondary || '#FFF8F0'
  const accent = color_palette?.accent || '#F4A261'

  // 按分类整理菜品
  const categoryMap: Record<string, typeof dishes> = {}
  dishes.forEach(d => {
    if (!categoryMap[d.category]) categoryMap[d.category] = []
    categoryMap[d.category].push(d)
  })
  const dishesText = Object.entries(categoryMap).map(([cat, items]) =>
    `【${cat}】\n` + items.map(d => `  ${d.name}${d.desc ? `（${d.desc}）` : ''} ¥${d.price}`).join('\n')
  ).join('\n\n')

  if (style === 'chinese') {
    return `生成一张印刷级中式餐厅菜单，比例2:3，A4竖版，商用质量。

品牌区域（顶部）：
- 品牌名「${brand_name}」，毛笔字风格大字，颜色${primary}
${brand_name_en ? `- 英文名「${brand_name_en}」衬线字体` : ''}
${slogan ? `- Slogan「${slogan}」装饰性小字` : ''}
- 顶部传统纹样装饰边框

菜品展示（按分类）：
${dishesText}

设计风格：国潮现代，传统与当代融合
配色：主色${primary}，辅助色${secondary}，点缀色${accent}
版式：竖排分类，价格右对齐，¥XX格式，有文化底蕴。

底部：「${brand_name}」${slogan ? `·「${slogan}」` : ''}

严格要求：
- 所有中文文字100%准确，无错别字，无乱码
- 每个价格格式严格为¥XX，与提供数据完全一致
- 这是菜单版面，不是海报，不是情绪板
- 印刷级品质，可直接商用`
  }

  if (style === 'minimal') {
    return `生成一张极简餐厅菜单，比例2:3，A4竖版，商用质量。

品牌区域：
- 品牌名「${brand_name}」大字左对齐，黑色
${brand_name_en ? `- 英文名「${brand_name_en}」细字` : ''}
${slogan ? `- Slogan「${slogan}」细小字` : ''}
- 品牌名下方一条细线分隔

菜品展示（按分类）：
${dishesText}

设计风格：极简高端，黑白灰为主，只用一个点缀色${primary}
版式：干净，留白充足，分类标题「CATEGORY · 品类名」，价格右对齐，¥XX格式。

底部：「${brand_name}」· MENU

严格要求：
- 所有文字100%准确，无乱码，无错别字
- 价格格式严格为¥XX，与提供数据完全一致
- 这是菜单版面布局，不是海报
- 极简有设计感，印刷级可商用`
  }

  // 默认：轻食清新版
  return `为「${brand_name}」生成一张印刷级餐厅菜单，比例2:3，A4竖版，商用质量。

背景与氛围：
温暖米白色纹理纸张背景（${secondary}），
四角点缀清新植物水彩插画（鼠尾草绿调，精致手绘风），
大量留白，清雅高端。

顶部品牌区：
- 顶部一条横幅：新鲜沙拉碗俯拍，柔和自然光，占页面高度约20%
- 品牌名「${brand_name}」居中，大字优雅字体，颜色${primary}
${brand_name_en ? `- 英文名「${brand_name_en}」细字居中` : ''}
${slogan ? `- Slogan「${slogan}」装饰小字，植物纹样分隔线` : ''}

菜品区（按分类双栏布局）：
${dishesText}

排版规则：
- 分类标题：${primary}加粗，「分类名 · CATEGORY」格式，旁边小叶片图标
- 菜品名：深色中等字重
- 价格：右对齐，${accent}，严格¥XX或¥XX.X格式
- 菜品间用点线分隔，行距充足，不拥挤

底部：
- 精致植物线稿插图
- 「${brand_name}」居中，${primary}
${slogan ? `- 「${slogan}」细小字` : ''}
- 底部细线边框

严格要求：
- 每个中文字符100%准确，无错别字，无乱码
- 每个价格与提供数据完全一致，¥XX格式
- 这是菜单版面布局，不是海报或情绪板
- 配色只用${primary}+${secondary}+${accent}
- 印刷级质量，可直接商用，所有文字清晰可读`
}

// ─── 品牌LOGO ───────────────────────────────────────────────
export function logoPrompt(
  brand: BrandProfile,
  logoDirection: string
): string {
  const { brand_name, brand_name_en, cuisine_type, style_preference, color_palette } = brand
  const primary = color_palette?.primary || '#A8D8A8'
  const secondary = color_palette?.secondary || '#FFF8F0'
  const styleKw = STYLE_KEYWORDS[style_preference] || style_preference

  return `为「${brand_name}」生成一套专业品牌LOGO设计方案，白色背景，高清输出。

品牌信息：
- 品牌名（中文）：「${brand_name}」
${brand_name_en ? `- 品牌名（英文）：「${brand_name_en}」` : ''}
- 品类：${cuisine_type === 'light_food' ? '轻食健康餐饮' : cuisine_type === 'cafe' ? '精品咖啡/茶饮' : cuisine_type === 'hotpot' ? '火锅/烤肉' : '餐饮品牌'}
- 设计风格：${style_preference}（${styleKw}）
- 主色：${primary}，辅助色：${secondary}

设计方向：${logoDirection}

展示方式：
在同一画面中展示3套不同风格的LOGO方案，
每套包含：图形标+文字标，横版+竖版两种排列，
白色背景，像专业设计提案页一样整齐排列。

设计约束：
- 品牌名「${brand_name}」文字必须100%准确，无错别字，无乱码
${brand_name_en ? `- 英文名「${brand_name_en}」文字必须准确` : ''}
- 图形元素与品牌调性高度匹配
- 不要使用通用模板感图形，要有原创设计感
- 配色严格在${primary}色系内，不要随意加入其他颜色
- 商用级别品质，矢量感清晰

严格要求：所有中文文字100%准确，无乱码，这是LOGO设计稿不是插画。`
}

// ─── 包装物料 ───────────────────────────────────────────────
export function packagingPrompt(brand: BrandProfile): string {
  const { brand_name, brand_name_en, cuisine_type, style_preference, slogan, color_palette } = brand
  const primary = color_palette?.primary || '#A8D8A8'
  const secondary = color_palette?.secondary || '#FFF8F0'
  const accent = color_palette?.accent || '#F4A261'
  const styleKw = STYLE_KEYWORDS[style_preference] || style_preference

  const packagingTypes: Record<string, string> = {
    light_food: '手提袋、沙拉碗盖贴、餐盒、纸杯、餐巾纸封套',
    cafe: '咖啡杯套、手提袋、包装盒、贴纸、咖啡豆包装',
    hotpot: '外卖袋、餐具包、蘸料包装、手提袋、围裙',
    chinese: '打包盒、手提袋、餐具套装、菜单夹、贴纸',
    fastfood: '外卖袋、打包盒、杯子、封口贴、手提袋',
  }
  const packaging = packagingTypes[cuisine_type] || '手提袋、打包盒、纸杯、贴纸封签'

  return `为「${brand_name}」生成一张高端品牌包装物料展示图，3:4竖版，商业级质感。

品牌信息：
- 品牌名：「${brand_name}」${brand_name_en ? `，英文名：「${brand_name_en}」` : ''}
- 品类：${cuisine_type === 'light_food' ? '轻食健康餐饮' : cuisine_type === 'cafe' ? '精品咖啡/茶饮' : cuisine_type === 'hotpot' ? '火锅/烤肉' : '餐饮品牌'}
- 核心气质：${style_preference}，${styleKw}
- 品牌主色：${primary}，辅助色：${secondary}，点缀色：${accent}
${slogan ? `- Slogan：「${slogan}」` : ''}

包装物料系统（按视觉层级排列）：
${packaging}

每件物料上印有品牌名「${brand_name}」${brand_name_en ? `和英文名「${brand_name_en}」` : ''}${slogan ? `，Slogan「${slogan}」` : ''}

设计语言：
${style_preference}风格，${styleKw}，
主色${primary}统一贯穿所有物料，
材质感真实，有品牌系统感，像顶级设计机构的品牌提案页。

构图要求：
- 物料整齐排列，主要物料最突出
- 不是杂乱的拼贴，而是有品牌系统感的展示
- 整体有可落地感，像真实可以生产的包装

严格要求：
- 品牌名「${brand_name}」文字100%准确，无错别字，无乱码
- 所有物料风格必须统一在同一品牌体系内
- 不要随机生成图形LOGO，只显示品牌文字`
}
