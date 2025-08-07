#!/bin/bash

# AI早报启动脚本

echo "🚀 正在启动AI早报平台..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未找到，请先安装Python3"
    exit 1
fi

# 检查pip
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip 未找到，请先安装pip"
    exit 1
fi

# 安装依赖
echo "📦 正在安装依赖..."
pip3 install -r requirements.txt

# 检查依赖安装是否成功
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，请检查网络连接或pip配置"
    exit 1
fi

# 创建必要的目录
mkdir -p templates static/css static/js

echo "✅ 依赖安装完成"
echo "💾 创建缓存目录..."
mkdir -p cache

echo "🌟 启动Web服务器..."
echo "🌐 应用将在 http://localhost:6888 启动"
echo "📋 缓存功能已启用 - 每天首次访问获取最新新闻，后续使用缓存"

# 检查运行模式
if [ "$FLASK_ENV" = "production" ]; then
    echo "🏭 生产环境模式"
    echo "⚙️  正在启动Gunicorn服务器..."
    
    # 使用Gunicorn启动
    gunicorn --config gunicorn.conf.py app:app
else
    echo "🛠️  开发环境模式"
    echo "⚙️  正在启动Flask开发服务器..."
    
    # 启动应用
    python3 app.py
fi
