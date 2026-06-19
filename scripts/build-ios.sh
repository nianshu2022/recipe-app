#!/bin/bash
# iOS 本地构建脚本
# 用法: ./scripts/build-ios.sh

set -e

echo "=== 知味 iOS 构建脚本 ==="

# 检查是否在 macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "错误: 此脚本只能在 macOS 上运行"
    echo "如果你使用 Windows，请使用 GitHub Actions 或借用 Mac"
    exit 1
fi

# 检查 Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "错误: 未安装 Xcode"
    echo "请从 App Store 安装 Xcode"
    exit 1
fi

echo "1. 安装依赖..."
npm ci

echo "2. 构建 Web 应用..."
npm run build

echo "3. 同步到 iOS..."
npx cap sync ios

echo "4. 构建 iOS 应用..."
cd ios/App

# 构建 archive
xcodebuild -workspace App.xcworkspace \
    -scheme App \
    -configuration Release \
    -archivePath $PWD/build/App.xcarchive \
    archive \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

echo "5. 导出 IPA..."
# 创建 exportOptions.plist
cat > exportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
    -archivePath build/App.xcarchive \
    -exportPath build/output \
    -exportOptionsPlist exportOptions.plist

echo ""
echo "=== 构建完成 ==="
echo "IPA 文件位置: ios/App/build/output/"
echo ""
echo "使用 AltStore 安装:"
echo "1. 将 IPA 文件传输到 iPhone"
echo "2. 打开 AltStore"
echo "3. 点击 + 号，选择 IPA 文件"
echo "4. 使用你的 Apple ID 签名安装"
