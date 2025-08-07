# 使用Python 3.11官方镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Playwright环境变量
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# 无头模式运行
ENV DISPLAY=:99
ENV DEBIAN_FRONTEND=noninteractive

# 安装系统依赖（包括Playwright需要的依赖）
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装Playwright浏览器
RUN playwright install chromium
RUN playwright install-deps chromium

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p cache static/audio templates

# 设置权限
RUN chmod +x start.sh

# 暴露端口
EXPOSE 6888

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:6888/aizaobao/ || exit 1

# 启动虚拟显示器（后台运行）并启动应用
CMD Xvfb :99 -screen 0 1024x768x24 -nolisten tcp & \
    gunicorn --bind 0.0.0.0:6888 --workers 1 --timeout 300 --keep-alive 2 --worker-class sync app:app
