#!/bin/bash

# AI早报应用一键部署脚本

set -e

echo "🚀 开始部署AI早报应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p cache static/audio

# 检查环境配置文件
if [ ! -f .env ]; then
    echo "📋 创建环境配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置您的参数"
fi

# 构建并启动服务
echo "🏗️  构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
if curl -f http://localhost:6888/ &> /dev/null; then
    echo "✅ 部署成功！"
    echo "🌐 应用访问地址: http://localhost:6888"
    echo "📊 查看日志: docker-compose logs -f"
    echo "🛑 停止服务: docker-compose down"
else
    echo "❌ 部署失败，请检查日志: docker-compose logs"
    exit 1
fi
