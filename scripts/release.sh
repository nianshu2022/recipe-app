#!/bin/bash
# 发布新版本到 R2
# 用法: ./scripts/release.sh <version>

VERSION=${1:-"1.0.7"}
APK_FILE="dist/zhivei-${VERSION}-android-arm64-release.apk"
BUCKET="zhivei-releases"

echo "=== 发布 zhivei v${VERSION} ==="

# 检查 APK 文件是否存在
if [ ! -f "$APK_FILE" ]; then
    echo "错误: APK 文件不存在: $APK_FILE"
    echo "请先运行 npm run build:android 构建 APK"
    exit 1
fi

# 上传到 R2
echo "上传 APK 到 R2..."
npx wrangler r2 object put "${BUCKET}/zhivei-${VERSION}-android-arm64-release.apk" --file="$APK_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 上传成功"
    echo "下载链接: https://pub-e0895a39a1f746bcbbaefc526fa28c4a.r2.dev/zhivei-${VERSION}-android-arm64-release.apk"
else
    echo "❌ 上传失败"
    exit 1
fi
