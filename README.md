# 知味

私人美食管家，帮你记录菜谱、推荐菜品、生成购物清单。

## 下载

[![Android](https://img.shields.io/badge/Android-v1.1.6-green)](https://github.com/nianshu2022/recipe-app/releases/download/v1.1.6/zhivei-1.1.6-android-arm64-release.apk)

- [最新 Release](https://github.com/nianshu2022/recipe-app/releases)

## 功能

- 菜谱管理 - 创建编辑菜谱，支持分类标签
- 智能推荐 - 按时间段推荐菜品
- 做菜引导 - 分步指导，支持计时
- 购物清单 - 管理食材购买
- 周餐计划 - 规划每日三餐
- 数据同步 - 多设备同步
- PWA 支持 - 离线可用

## 项目结构

- `src/` - Web 端源码（React + TypeScript）
- `miniapp-native/` - 微信小程序源码（原生）
- `server/` - 后端服务（Cloudflare Workers）

## 技术栈

### Web 端
- React 19 + TypeScript + Tailwind CSS
- Zustand + React Router v7
- Cloudflare Workers + D1
- Vite + PWA

### 微信小程序
- 原生微信小程序开发
- WXML + WXSS + JavaScript

## 开发

### Web 端
```bash
npm install
npm run dev
```

### 微信小程序
1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具，导入 `miniapp-native` 目录
3. 配置 AppID（在 `project.config.json` 中修改）
4. 开始开发

## 部署

- Web 端：推送到 main 分支自动部署到 Cloudflare Pages
- 微信小程序：使用微信开发者工具上传代码并提交审核

## 链接

- Web 端：https://recipe.nianshu2022.cn
- GitHub：https://github.com/nianshu2022/recipe-app

## License

MIT
