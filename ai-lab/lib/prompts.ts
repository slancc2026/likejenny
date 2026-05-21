import { BrandProfile } from '@/types'

// ── 菜品精修 ────────────────────────────────────────
export function enhancePrompt(cuisineType: string): string {
  if (cuisineType === 'light_food') {
    return `Professional food photography enhancement,
clean white marble surface, bright natural lighting from upper left,
fresh healthy aesthetic, shallow depth of field with soft bokeh,
commercial quality suitable for restaurant menu,
vibrant but natural colors, crisp sharp details, appetizing presentation`
  }
  return `Transform into professional Chinese restaurant advertisement photo,
warm wooden surface, dramatic warm lighting, rich colors,
commercial menu quality, appetizing`
}

// ── 宣传海报 ────────────────────────────────────────
export function posterPrompt(
  brand: BrandProfile,
  type: 'daily' | 'festival' | 'newproduct',
  params: { dish_name: string; price: string; festival?: string; dish_desc?: string }
): string {
  const { dish_name, price, festival, dish_desc } = params
  const { brand_name, style_preference, color_palette } = brand

  if (type === 'daily') {
    return `${brand_name}餐厅日常宣传图，
主推菜品：${dish_name}，价格¥${price}，
${style_preference}风格，主色${color_palette.primary}，
专业餐饮宣传图，食欲感强，
品牌名${brand_name}清晰显示，商业级质感`
  }

  if (type === 'festival') {
    return `${festival}主题餐厅营销海报，
品牌：${brand_name}，
节日氛围感强，色调与${festival}契合，
主推：${dish_name} 限时¥${price}，
品牌名${brand_name}醒目显示，
${style_preference}风格`
  }

  // newproduct
  return `餐厅新品上市宣传图，
品牌：${brand_name}，
新品：${dish_name}，定价¥${price}，
${dish_desc || ''}，突出新品概念，
视觉冲击力强，${style_preference}风格，
主色${color_palette.primary}，商业级质感`
}

// ── 菜单设计 ────────────────────────────────────────
export function menuPrompt(brand: BrandProfile, dishes: string): string {
  const { brand_name, brand_name_en, slogan, color_palette } = brand
  return `生成一张印刷级轻食餐厅菜单，比例2:3，A4竖版。
顶部品牌：${brand_name}大字居中，
英文名${brand_name_en}小字，
Slogan：${slogan}

菜品列表（分类展示）：
${dishes}

设计风格：清新ins风，极简现代
主色：${color_palette.primary}，辅色：${color_palette.secondary}
分类标题用「中文 · ENGLISH」双语格式
价格右对齐，¥XX格式
底部：${brand_name} · ${slogan}

要求：所有文字清晰无乱码，价格格式正确，
印刷级品质，可直接商用打印`
}

// ── 品牌LOGO ─────────────────────────────────────────
export function logoPrompt(brand: BrandProfile, variant: number): string {
  const { brand_name, brand_name_en, cuisine_type, style_preference, color_palette } = brand
  const styles = [
    `简洁现代，几何图形为主，适合年轻化品牌`,
    `文字为主，优雅精致，中英文组合排版`,
    `图文结合，融入自然元素（叶子/碗/植物），温馨有机感`,
  ]
  return `为${brand_name}设计一个专业餐饮品牌LOGO，
${cuisine_type}品牌，${style_preference}风格，
主色${color_palette.primary}，

设计方向：${styles[variant]}
使用与轻食相关的图形语言，
品牌名「${brand_name}」中文清晰显示，
英文「${brand_name_en}」作为副标题，
整体简洁有记忆点，适合餐饮品牌使用，
白色背景，高清矢量感`
}

// ── 包装物料 ─────────────────────────────────────────
export function packagingPrompt(brand: BrandProfile): string {
  const { brand_name, brand_name_en, cuisine_type, style_preference, target_customer, color_palette, slogan } = brand
  return `为${brand_name}生成一张高端品牌触点系统视觉板，
不是单张海报，而是一套完整品牌应用展示。

品牌定位：${cuisine_type}餐饮品牌，目标客群${target_customer}
核心气质：清新自然、精致生活、健康治愈

触点系统包含：
- 主菜品hero shot
- 外卖袋/纸杯/餐盒/贴纸等品牌物料
- 菜单卡/价目表排版样张
- 用餐生活方式场景
- 配色${color_palette.primary}+${color_palette.secondary}统一应用

设计语言：${style_preference}，主色${color_palette.primary}，
辅助色${color_palette.secondary}，大量留白，细腻材质。

品牌名「${brand_name}」，英文「${brand_name_en}」，
Slogan「${slogan}」必须准确出现，文字不得有错别字。

构图：顶级设计机构提案页风格，有品牌系统感。
约束：不要乱码文字；不要杂乱拼贴；所有物料风格统一。
比例：3:4竖版`
}
