# 菜谱助手微信小程序

## 快速开始

### 1. 安装依赖

```bash
cd miniapp
npm install
```

### 2. 准备 TabBar 图标

在 `src/assets/` 目录下放置 10 个 81x81 PNG 图标文件：
- `tab-home.png` / `tab-home-active.png` (菜谱库)
- `tab-calendar.png` / `tab-calendar-active.png` (日历)
- `tab-plan.png` / `tab-plan-active.png` (周计划)
- `tab-fridge.png` / `tab-fridge-active.png` (冰箱)
- `tab-user.png` / `tab-user-active.png` (我的)

可从 Lucide 图标库导出，active 版本使用主色 #c9583a 着色。

### 3. 配置 AppID

编辑 `project.config.json`，将 `appid` 替换为你的微信小程序 AppID。

### 4. 开发编译

```bash
npm run dev:weapp
```

### 5. 微信开发者工具预览

打开微信开发者工具，导入项目目录指向 `miniapp/dist/`。

## 与 Web 端共享的代码

- `src/types/index.ts` — 类型定义（原样复制）
- `src/utils/scaling.ts` — 份量计算（原样复制）
- `src/utils/recommendations.ts` — 推荐算法（原样复制）
- `src/constants/units.ts` — 单位常量（原样复制）

## 已适配的模块

- `src/utils/storage.ts` — Taro 存储适配器（替代 IndexedDB）
- `src/utils/sync.ts` — 使用 Taro.request 替代 fetch
- `src/utils/backup.ts` — 使用 Taro 文件系统 API
- `src/utils/share.ts` — 微信原生分享
- `src/stores/themeStore.ts` — 使用 Taro.getSystemInfoSync

## 与 Web 端的差异

| 功能 | Web 端 | 小程序 |
|------|--------|--------|
| 本地存储 | IndexedDB | Taro.setStorageSync (10MB 限制) |
| 网络请求 | fetch | Taro.request |
| 路由 | React Router | Taro 原生路由 |
| 样式 | Tailwind CSS | SCSS |
| 图标 | Lucide React | NutUI IconFont / Emoji |
| 语音控制 | Web Speech API | 不支持 |
| 分享 | html2canvas 截图 | 微信原生分享 |
| PWA | 支持 | 不适用 |
| 暗色模式 | DOM class 切换 | CSS 变量 / 系统主题 |
