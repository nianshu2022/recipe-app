# 知味

一款私人美食管家 PWA 应用，帮你记录拿手好菜、智能推荐菜谱、生成购物清单。

## 功能特性

- **菜谱管理** - 创建、编辑、删除菜谱，支持分类、标签、难度、时长等信息
- **内置菜谱库** - 觅食页面浏览内置菜谱，支持按分类、难度筛选，一键导入
- **智能推荐** - 根据时间段（早中晚餐、下午茶、夜宵）智能推荐菜谱
- **做菜引导** - 分步骤引导做菜，支持步骤计时（循环响铃提醒）和语音控制
- **菜谱盲盒** - 随机推荐菜谱，解决选择困难
- **购物清单** - 根据菜谱自动生成购物清单
- **周餐计划** - 规划一周的餐食安排
- **冰箱管理** - 记录冰箱里的食材，避免浪费
- **条码扫描** - 扫描商品条码快速添加食材
- **做菜日历** - 记录做菜历史
- **收藏夹** - 收藏喜欢的菜谱
- **数据同步** - 登录后支持多设备数据同步
- **PWA 支持** - 可安装到桌面，离线使用

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS
- **小程序**: Taro + React
- **状态管理**: Zustand
- **路由**: React Router v7
- **本地存储**: IndexedDB (idb)
- **后端**: Cloudflare Workers + D1
- **对象存储**: Cloudflare R2
- **构建工具**: Vite
- **PWA**: vite-plugin-pwa

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 部署

项目已部署到 Cloudflare Pages：
- 主域名: https://recipe-app-8is.pages.dev
- 自定义域名: https://recipe.nianshu2022.cn

推送到 GitHub main 分支会自动部署。

## 项目结构

```
src/
├── components/     # 公共组件
│   ├── layout/     # 布局组件
│   └── ui/         # 通用 UI 组件
├── data/           # 内置菜谱数据
├── hooks/          # 自定义 hooks
├── pages/          # 页面组件
│   ├── home/       # 首页（寻味）
│   ├── discover/   # 觅食（内置菜谱浏览）
│   ├── recipe/     # 菜谱详情与编辑
│   ├── cooking/    # 做菜引导（计时+语音）
│   ├── blind-box/  # 菜谱盲盒（味遇）
│   ├── meal-plan/  # 周餐计划（七日味）
│   ├── calendar/   # 做菜日历
│   ├── fridge/     # 冰箱管理
│   ├── shopping/   # 购物清单
│   ├── collection/ # 收藏夹
│   └── settings/   # 设置（小窝）
├── stores/         # Zustand 状态管理
├── utils/          # 工具函数
├── types/          # TypeScript 类型定义
└── db/             # IndexedDB 数据库

miniapp/            # 微信小程序（Taro）
server/             # Cloudflare Workers 后端
```

## License

MIT
