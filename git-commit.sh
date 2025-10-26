#!/bin/bash

# ==================================================
# 智运通交易系统 - Git提交脚本
# ==================================================

echo "🚀 智运通交易系统 Git提交脚本"
echo "=================================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    echo "💡 提示：确保在 /home/lc/luckee_dao/Dex 目录下运行"
    exit 1
fi

# 检查git状态
echo "📋 检查Git状态..."
if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "⚠️  检测到未提交的更改"
    git status --short
    echo ""
    read -p "是否要继续提交这些更改? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 操作已取消"
        exit 1
    fi
fi

# 添加文件
echo "📦 添加文件到Git..."
git add .

# 检查将要提交的文件
echo "🔍 检查将要提交的文件："
echo "=================================="
git status --porcelain | head -20

# 如果文件太多，只显示前20个
if [ $(git status --porcelain | wc -l) -gt 20 ]; then
    echo "... 还有更多文件"
fi

echo "=================================="

# 提示用户输入提交信息
echo "📝 请输入提交信息："
read -r commit_message

if [ -z "$commit_message" ]; then
    commit_message="feat: 更新智运通交易系统"
    echo "ℹ️  使用默认提交信息：$commit_message"
fi

# 提交更改
echo "💾 提交更改..."
git commit -m "$commit_message"

# 显示提交结果
echo "✅ 提交成功！"
echo "📊 提交摘要："
git log --oneline -1

echo ""
echo "🎯 下一步操作："
echo "1. 推送到GitHub：./scripts/upload_to_github.sh"
echo "2. 或手动推送：git push origin main"
echo "3. 创建标签：git tag v1.0.0 && git push origin --tags"
echo "4. 查看状态：git status"

echo ""
echo "📋 快速命令："
echo "- 上传到GitHub：./scripts/upload_to_github.sh"
echo "- 查看提交历史：git log --oneline -5"
echo "- 创建新分支：git checkout -b feature/新功能名"

echo ""
echo "📋 排除的文件类型："
echo "- 文档目录 (docs/)"
echo "- 脚本目录 (scripts/)"
echo "- 构建产物 (node_modules/, dist/)"
echo "- 环境变量 (.env*)"
echo "- 日志文件 (*.log)"
echo "- IDE文件 (.vscode/, .idea/)"
