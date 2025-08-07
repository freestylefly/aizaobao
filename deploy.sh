#!/bin/bash

# AI早报应用Docker部署脚本
# 用法: ./deploy.sh [deploy|restart|stop|logs|status|build|down]

set -e

APP_NAME="AI早报应用"
COMPOSE_FILE="docker-compose.yml"

# 检查Docker环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker未安装，请先安装Docker"
        echo "📖 安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose未安装，请先安装Docker Compose"
        echo "📖 安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # 检查Docker是否运行
    if ! docker info &> /dev/null; then
        echo "❌ Docker服务未运行，请启动Docker"
        exit 1
    fi
}

# 检查应用是否运行
is_running() {
    if docker-compose ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# 部署应用
deploy_app() {
    echo "🚀 开始部署$APP_NAME..."
    
    check_docker
    
    # 创建必要的目录
    echo "📁 创建必要的目录..."
    mkdir -p cache static/audio

    # 检查环境配置文件
    if [ ! -f .env ]; then
        echo "📋 创建环境配置文件..."
        if [ -f config.example ]; then
            cp config.example .env
        else
            echo "FLASK_ENV=production" > .env
        fi
        echo "⚠️  请编辑 .env 文件配置您的参数"
    fi

    # 停止现有服务（如果在运行）
    if is_running; then
        echo "🛑 停止现有服务..."
        docker-compose down
    fi

    # 构建并启动服务
    echo "🏗️  构建Docker镜像..."
    docker-compose build --no-cache

    echo "🚀 启动服务..."
    docker-compose up -d

    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 15

    # 健康检查
    local max_attempts=6
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🔍 健康检查 (第$attempt次/共$max_attempts次)..."
        if curl -f http://localhost:6888/ &> /dev/null; then
            echo "✅ 部署成功！"
            echo "🌐 应用访问地址: http://localhost:6888"
            echo "📊 查看日志: ./deploy.sh logs"
            echo "🛑 停止服务: ./deploy.sh stop"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            echo "⏳ 等待5秒后重试..."
            sleep 5
        fi
        
        ((attempt++))
    done
    
    echo "❌ 部署失败，服务无法正常响应"
    echo "📊 查看日志: ./deploy.sh logs"
    exit 1
}

# 重启应用
restart_app() {
    echo "🔄 正在重启$APP_NAME..."
    
    check_docker
    
    if is_running; then
        echo "🔄 重启Docker容器..."
        docker-compose restart
        
        # 等待重启
        echo "⏳ 等待服务重启..."
        sleep 10
        
        if is_running; then
            echo "✅ $APP_NAME 重启成功"
            echo "🌐 应用访问地址: http://localhost:6888"
        else
            echo "❌ $APP_NAME 重启失败"
            echo "📊 查看日志: ./deploy.sh logs"
            exit 1
        fi
    else
        echo "⚠️  $APP_NAME 未在运行，将重新部署..."
        deploy_app
    fi
}

# 停止应用
stop_app() {
    echo "🛑 正在停止$APP_NAME..."
    
    check_docker
    
    if is_running; then
        docker-compose down
        echo "✅ $APP_NAME 已停止"
    else
        echo "⚠️  $APP_NAME 未在运行"
    fi
}

# 完全关闭（包括清理）
down_app() {
    echo "🧹 正在完全关闭$APP_NAME..."
    
    check_docker
    
    docker-compose down --volumes --remove-orphans
    echo "✅ $APP_NAME 已关闭并清理资源"
}

# 查看日志
show_logs() {
    check_docker
    
    if is_running; then
        echo "📊 显示$APP_NAME 日志（按 Ctrl+C 退出）..."
        docker-compose logs -f --tail=100
    else
        echo "⚠️  $APP_NAME 未在运行"
        echo "📊 显示最近的日志..."
        docker-compose logs --tail=50
    fi
}

# 查看状态
status_app() {
    check_docker
    
    echo "📋 $APP_NAME 状态信息："
    echo ""
    
    # 容器状态
    echo "🐳 Docker容器状态："
    docker-compose ps
    echo ""
    
    # 服务健康检查
    if is_running; then
        echo "✅ 服务状态: 运行中"
        echo "🌐 访问地址: http://localhost:6888"
        
        # 网络检查
        if curl -f http://localhost:6888/ &> /dev/null; then
            echo "🔗 网络状态: 正常"
        else
            echo "❌ 网络状态: 异常（服务无响应）"
        fi
        
        # 资源使用情况
        echo ""
        echo "📊 资源使用情况："
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep aizaobao || echo "   无法获取资源信息"
    else
        echo "❌ 服务状态: 未运行"
    fi
}

# 重新构建
build_app() {
    echo "🏗️  重新构建$APP_NAME..."
    
    check_docker
    
    # 停止服务
    if is_running; then
        echo "🛑 停止现有服务..."
        docker-compose down
    fi
    
    # 清理旧镜像
    echo "🧹 清理旧镜像..."
    docker-compose down --rmi local 2>/dev/null || true
    
    # 重新构建
    echo "🏗️  重新构建镜像..."
    docker-compose build --no-cache
    
    echo "✅ 镜像构建完成"
    echo "🚀 启动服务: ./deploy.sh deploy"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  deploy   部署$APP_NAME（默认）"
    echo "  restart  重启$APP_NAME"
    echo "  stop     停止$APP_NAME"
    echo "  down     停止并清理$APP_NAME"
    echo "  logs     查看$APP_NAME日志"
    echo "  status   查看$APP_NAME状态"
    echo "  build    重新构建镜像"
    echo "  help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy     # 部署应用"
    echo "  $0 restart    # 重启应用"
    echo "  $0 logs       # 查看日志"
    echo "  $0 status     # 查看状态"
    echo ""
    echo "更多管理命令:"
    echo "  docker-compose ps              # 查看容器状态"
    echo "  docker-compose exec aizaobao bash  # 进入容器"
    echo "  docker-compose pull            # 更新基础镜像"
}

# 主逻辑
case "${1:-deploy}" in
    deploy)
        deploy_app
        ;;
    restart)
        restart_app
        ;;
    stop)
        stop_app
        ;;
    down)
        down_app
        ;;
    logs)
        show_logs
        ;;
    status)
        status_app
        ;;
    build)
        build_app
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ 未知命令: $1"
        show_help
        exit 1
        ;;
esac
