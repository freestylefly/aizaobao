# AI早报 - 智能语音新闻平台

一个基于Flask和Minimax语音合成技术的现代化AI新闻语音播报平台，具有科技感十足的用户界面。

![界面](https://cdn.canghecode.com/blog/20250807205732.png)

## ✨ 主要功能

- 🔥 **实时新闻获取**: 自动抓取最新AI科技资讯
- 💾 **智能缓存机制**: 每天首次访问获取最新内容，当天其余时间使用缓存
- 📚 **历史记录功能**: 按天显示AI早报历史记录，支持查看和复制往期内容
- 🎵 **智能语音合成**: 基于Minimax API的高质量语音生成
- ⚙️ **个性化配置**: 用户可自定义API配置和语音参数
- 🎚️ **音频参数调节**: 支持语速、声调、音量等参数的精细控制
- 🎧 **在线播放**: 支持音频在线播放和下载
- 📋 **一键复制**: 快速复制格式化的新闻内容
- 🔗 **音频分享**: 生成音频后一键获取分享链接，方便分享
- 📱 **响应式设计**: 适配桌面和移动设备
- 🌟 **科技感UI**: 现代化的深色主题和炫酷动效

## 🚀 技术栈

### 后端
- **Flask**: Python Web框架
- **crawl4ai**: 网页内容抓取
- **requests**: HTTP请求处理
- **Minimax API**: 语音合成服务

### 前端
- **HTML5**: 现代化标记语言
- **CSS3**: 响应式设计和动画效果
- **JavaScript ES6+**: 交互逻辑和API调用
- **Font Awesome**: 图标库

## 📦 部署指南

### 🚀 服务器部署（生产环境）

#### 方式一：Docker部署（强烈推荐）
Docker部署自动解决所有依赖问题，包括Playwright浏览器安装。

```bash
# 1. 克隆项目
git clone https://github.com/freestylefly/aizaobao.git
cd aizaobao

# 2. 一键部署
./deploy.sh deploy

# 或使用其他管理命令
./deploy.sh restart   # 重启应用
./deploy.sh stop      # 停止应用  
./deploy.sh logs      # 查看日志
./deploy.sh status    # 查看状态
./deploy.sh help      # 查看帮助
```

#### 方式二：传统服务器部署
```bash
# 1. 克隆项目
git clone https://github.com/freestylefly/aizaobao.git
cd aizaobao

# 2. 安装Python依赖
pip install -r requirements.txt

# 3. 安装Playwright浏览器（重要！）
playwright install chromium
playwright install-deps chromium

# 4. 配置环境变量
cp config.example .env
# 编辑 .env 文件，设置SECRET_KEY等

# 5. 启动应用
FLASK_ENV=production ./start.sh start

# 其他管理命令
./start.sh restart   # 重启应用
./start.sh stop      # 停止应用
./start.sh status    # 查看状态
./start.sh help      # 查看帮助
```

### 💻 本地部署（开发环境）

```bash
# 1. 克隆项目
git clone https://github.com/freestylefly/aizaobao.git
cd aizaobao

# 2. 安装Python依赖
pip install -r requirements.txt

# 3. 安装Playwright浏览器
playwright install chromium

# 4. 启动开发环境
./start.sh start     # 推荐使用脚本启动
# 或直接运行
python app.py

# 管理命令
./start.sh restart   # 重启应用
./start.sh stop      # 停止应用
./start.sh status    # 查看状态
```

### 🌐 访问应用
- **本地访问**: http://localhost:6888
- **服务器访问**: http://[服务器IP]:6888

## ⚙️ 配置说明

### 环境变量配置
创建 `.env` 文件（服务器部署推荐）：
```bash
# Flask配置
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here

# 应用配置
HOST=0.0.0.0
PORT=6888

# Minimax API配置（可选，也可在界面中配置）
MINIMAX_GROUP_ID=your-group-id
MINIMAX_API_KEY=your-api-key
```

### Minimax API配置
1. 注册并获取Minimax API账户：https://platform.minimaxi.com/user-center/basic-information/interface-key
2. 在设置面板中配置以下参数：
   - **Group ID**: 您的Minimax Group ID
  Group ID在账户管理这里获取：

![Minimax Group ID](https://cdn.canghecode.com/blog/20250807205410.png)
   - **API Key**: 您的Minimax API密钥
![Minimax API密钥](https://cdn.canghecode.com/blog/20250807205555.png)

### 语音参数配置
- **模型**: 选择语音合成模型
- **音色**: 选择不同的语音音色
- **情绪**: 设置语音情绪（中性、开心、悲伤等）
- **语速**: 0.5-2.0倍速调节
- **声调**: -12到+12半音调节
- **音量**: 0.1-2.0倍音量调节

## 🐛 常见问题

### 1. Playwright浏览器问题
如果遇到以下错误：
```
BrowserType.launch: Executable doesn't exist at /root/.cache/ms-playwright/chromium-1134/chrome-linux/chrome
```

**解决方案：**
- **Docker部署**：新版Dockerfile已自动解决，重新构建镜像即可
- **本地/服务器部署**：
```bash
# 安装Playwright浏览器
playwright install chromium
playwright install-deps chromium

# 如果权限问题，使用sudo
sudo playwright install chromium
sudo playwright install-deps chromium
```

### 2. 端口占用问题
```bash
# 查看端口占用
lsof -i :6888

# 终止占用进程
kill -9 <PID>
```

### 3. 依赖安装失败
```bash
# 升级pip
pip install --upgrade pip

# 重新安装依赖
pip install -r requirements.txt --force-reinstall
```

### 4. Docker部署问题
```bash
# 清理Docker缓存
docker system prune -f

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

## 🔧 运维管理

### Docker环境（推荐使用deploy.sh）
```bash
# 使用增强的部署脚本
./deploy.sh status    # 查看详细状态
./deploy.sh logs      # 查看实时日志
./deploy.sh restart   # 重启服务
./deploy.sh stop      # 停止服务
./deploy.sh build     # 重新构建镜像

# 原生Docker命令
docker-compose ps     # 查看容器状态
docker-compose logs -f # 查看日志
docker-compose restart # 重启服务
docker-compose down   # 停止服务
```

### 传统部署（使用start.sh）
```bash
# 使用增强的启动脚本
./start.sh status     # 查看应用状态
./start.sh restart    # 重启应用
./start.sh stop       # 停止应用
./start.sh start      # 启动应用

# 原生命令
ps aux | grep python  # 查看进程
pkill -f "python.*app.py"  # 停止进程
```

### 防火墙配置（服务器部署）
```bash
# Ubuntu/Debian
sudo ufw allow 6888

# CentOS/RHEL  
sudo firewall-cmd --permanent --add-port=6888/tcp
sudo firewall-cmd --reload
```

## 🎯 使用指南

### 基本使用流程
1. **配置API**: 点击设置按钮，输入Minimax API信息
2. **获取新闻**: 应用会自动获取最新AI新闻（首次访问从网络获取，后续当天访问使用缓存）
3. **一键复制**: 点击"一键复制"按钮快速复制格式化的新闻内容
4. **生成语音**: 点击"生成语音"按钮转换文本为音频
5. **播放/下载**: 使用播放器在线收听或下载音频文件

### 缓存机制
- **智能缓存**: 每天第一次访问时从网络获取最新新闻并缓存
- **快速加载**: 当天后续访问直接使用缓存，加载速度更快
- **状态显示**: 界面会显示新闻来源（"来自缓存" 或 "最新获取"）
- **强制刷新**: 可点击"强制刷新"按钮忽略缓存获取最新内容
- **自动清理**: 系统会自动清理3天前的旧缓存文件

### 快捷键
- `Ctrl/Cmd + Enter`: 生成音频
- `Ctrl/Cmd + C`: 一键复制新闻内容
- `F5`: 刷新新闻（优先使用缓存）
- `ESC`: 关闭设置面板

### 操作按钮
- **刷新**: 重新加载新闻（优先使用当天缓存）
- **历史记录**: 查看按天排列的AI早报历史记录
- **一键复制**: 复制格式化的新闻文本到剪贴板
- **生成语音**: 将新闻文本转换为音频
- **播放**: 在线播放生成的音频
- **下载**: 下载音频文件到本地
- **分享**: 一键复制音频分享链接，方便发送给好友

### 历史记录功能
- **按天展示**: 历史记录按日期倒序排列，方便查找
- **预览功能**: 每条历史记录显示前3条新闻预览
- **快速操作**: 支持直接查看完整内容或复制到剪贴板
- **全屏展示**: 历史记录以全屏弹窗形式展示，浏览体验佳
- **响应式设计**: 在移动设备上也有良好的展示效果

## 🔧 API接口

### 获取新闻
```
GET /api/news
```

### 配置管理
```
GET /api/config     # 获取配置
POST /api/config    # 更新配置
```

### 音频生成
```
POST /api/generate-audio    # 生成音频
POST /api/download-audio    # 下载音频
```

## 🎨 界面特色

- **深色主题**: 科技感十足的深色配色方案
- **渐变效果**: 炫酷的CSS渐变和光效
- **动画交互**: 流畅的过渡动画和悬停效果
- **响应式布局**: 完美适配各种屏幕尺寸
- **现代化组件**: 美观的滑动条、按钮和卡片设计

## 📱 移动端适配

项目已完全适配移动设备，包括：
- 响应式布局设计
- 触摸友好的交互元素
- 优化的移动端设置面板
- 自适应的文字和按钮大小

## 🔒 安全说明

- API密钥仅存储在用户会话中，不会持久化
- 所有音频数据采用安全的base64编码传输
- 支持HTTPS部署环境

## 🆕 版本更新

### v1.0.0
- 初始版本发布
- 基础的新闻抓取和语音合成功能
- 科技感UI设计
- 移动端适配

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues页面
- 邮件联系

---

**享受AI语音新闻的科技体验！** 🚀
