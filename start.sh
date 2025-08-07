#!/bin/bash

# AI早报启动脚本
# 用法: ./start.sh [start|stop|restart|status]

APP_NAME="AI早报平台"
PID_FILE="/tmp/aizaobao.pid"
LOG_FILE="/tmp/aizaobao.log"

# 获取应用进程ID
get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        pgrep -f "python.*app.py" | head -1
    fi
}

# 检查应用是否运行
is_running() {
    local pid=$(get_pid)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# 启动应用
start_app() {
    echo "🚀 正在启动$APP_NAME..."
    
    if is_running; then
        echo "⚠️  $APP_NAME 已经在运行中"
        return 0
    fi
    
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
    echo "📦 正在检查依赖..."
    pip3 install -r requirements.txt > /dev/null 2>&1

    # 检查依赖安装是否成功
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查网络连接或pip配置"
        exit 1
    fi

    # 创建必要的目录
    mkdir -p templates static/css static/js cache static/audio

    echo "🌐 应用将在 http://localhost:6888 启动"
    echo "📋 缓存功能已启用 - 每天首次访问获取最新新闻，后续使用缓存"

    # 检查运行模式
    if [ "$FLASK_ENV" = "production" ]; then
        echo "🏭 生产环境模式"
        echo "⚙️  正在启动Gunicorn服务器..."
        
        # 使用Gunicorn启动（彻底后台运行）
        setsid nohup gunicorn --config gunicorn.conf.py app:app > "$LOG_FILE" 2>&1 < /dev/null &
        echo $! > "$PID_FILE"
        disown
    else
        echo "🛠️  开发环境模式"
        echo "⚙️  正在启动Flask开发服务器..."
        
        # 启动应用（彻底后台运行）
        setsid nohup python3 app.py > "$LOG_FILE" 2>&1 < /dev/null &
        echo $! > "$PID_FILE"
        disown
    fi
    
    # 等待启动
    sleep 3
    
    if is_running; then
        echo "✅ $APP_NAME 启动成功！"
        echo "📊 查看日志: tail -f $LOG_FILE"
        echo "🛑 停止服务: ./start.sh stop"
    else
        echo "❌ $APP_NAME 启动失败，请查看日志: cat $LOG_FILE"
        exit 1
    fi
}

# 停止应用
stop_app() {
    echo "🛑 正在停止$APP_NAME..."
    
    local pid=$(get_pid)
    if [ -n "$pid" ]; then
        echo "📋 正在停止进程 $pid"
        kill "$pid" 2>/dev/null
        sleep 2
        
        # 强制停止
        if kill -0 "$pid" 2>/dev/null; then
            echo "⚠️  强制停止进程"
            kill -9 "$pid" 2>/dev/null
        fi
        
        # 清理PID文件
        rm -f "$PID_FILE"
        echo "✅ $APP_NAME 已停止"
    else
        echo "⚠️  $APP_NAME 未在运行"
    fi
    
    # 清理其他可能的进程
    pkill -f "python.*app.py" 2>/dev/null || true
}

# 重启应用
restart_app() {
    echo "🔄 正在重启$APP_NAME..."
    stop_app
    sleep 2
    start_app
}

# 查看状态
status_app() {
    if is_running; then
        local pid=$(get_pid)
        echo "✅ $APP_NAME 正在运行 (PID: $pid)"
        echo "🌐 访问地址: http://localhost:6888"
        echo "📊 日志文件: $LOG_FILE"
        
        # 显示进程信息
        if command -v ps &> /dev/null; then
            echo "📋 进程信息:"
            ps -p "$pid" -o pid,ppid,cmd 2>/dev/null || echo "   无法获取进程信息"
        fi
    else
        echo "❌ $APP_NAME 未在运行"
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start    启动$APP_NAME"
    echo "  stop     停止$APP_NAME"
    echo "  restart  重启$APP_NAME"
    echo "  status   查看运行状态"
    echo "  help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start      # 启动应用"
    echo "  $0 restart    # 重启应用"
    echo "  $0 status     # 查看状态"
}

# 主逻辑
case "${1:-start}" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        status_app
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
