// 全局变量
let currentAudioData = null;
let currentFilename = null;
let currentShareUrl = null;
let isGenerating = false;
let currentNewsContent = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    loadConfig();
    loadNews();
    initializeSliders();
    initializeEventListeners();
}

// 初始化滑动条事件
function initializeSliders() {
    const speedSlider = document.getElementById('speed');
    const pitchSlider = document.getElementById('pitch');
    const volSlider = document.getElementById('vol');
    
    speedSlider.addEventListener('input', function() {
        document.getElementById('speedValue').textContent = this.value;
    });
    
    pitchSlider.addEventListener('input', function() {
        document.getElementById('pitchValue').textContent = this.value;
    });
    
    volSlider.addEventListener('input', function() {
        document.getElementById('volValue').textContent = this.value;
    });
}

// 初始化事件监听器
function initializeEventListeners() {
    // 点击设置面板外部区域关闭面板
    document.addEventListener('click', function(e) {
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsBtn = document.querySelector('.nav-btn[onclick="toggleSettings()"]');
        
        if (settingsPanel.classList.contains('active') && 
            !settingsPanel.contains(e.target) && 
            !settingsBtn.contains(e.target)) {
            toggleSettings();
        }
    });
    
    // 点击历史记录面板外部区域关闭面板
    document.addEventListener('click', function(e) {
        const historyPanel = document.getElementById('historyPanel');
        const historyBtn = document.querySelector('.nav-btn[onclick="toggleHistory()"]');
        
        if (historyPanel.classList.contains('active') && 
            !historyPanel.contains(e.target) && 
            !historyBtn.contains(e.target)) {
            toggleHistory();
        }
    });
    
    // 点击历史详情模态框外部区域关闭模态框
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('historyDetailModal');
        const modalContent = modal?.querySelector('.modal-content');
        
        if (modal && modal.style.display === 'flex' && 
            modalContent && !modalContent.contains(e.target)) {
            hideHistoryDetail();
        }
    });
}

// 切换设置面板
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('active');
}

// 切换历史记录面板
function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    const isActive = panel.classList.contains('active');
    
    if (isActive) {
        panel.classList.remove('active');
    } else {
        panel.classList.add('active');
        // 首次打开时加载历史记录
        loadHistoryList();
    }
}

// 显示状态消息
function showMessage(text, type = 'info', duration = 3000) {
    const messageEl = document.getElementById('statusMessage');
    const messageText = document.getElementById('messageText');
    
    messageText.textContent = text;
    messageEl.style.display = 'block';
    
    // 根据类型设置不同样式
    messageEl.className = 'status-message';
    if (type === 'success') {
        messageEl.style.borderColor = '#10b981';
        messageEl.querySelector('i').style.color = '#10b981';
    } else if (type === 'error') {
        messageEl.style.borderColor = '#ef4444';
        messageEl.querySelector('i').style.color = '#ef4444';
    } else {
        messageEl.style.borderColor = '#00d4ff';
        messageEl.querySelector('i').style.color = '#00d4ff';
    }
    
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, duration);
}

// 加载配置
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        // 填充表单
        document.getElementById('groupId').value = config.group_id || '';
        document.getElementById('apiKey').value = config.api_key === '...' ? '' : config.api_key || '';
        document.getElementById('model').value = config.model || 'speech-2.5-hd-preview';
        document.getElementById('voiceId').value = config.voice_id || 'Boyan_new_platform';
        document.getElementById('emotion').value = config.emotion || 'neutral';
        document.getElementById('speed').value = config.speed || 1.0;
        document.getElementById('pitch').value = config.pitch || 0;
        document.getElementById('vol').value = config.vol || 1.0;
        
        // 更新滑动条显示
        document.getElementById('speedValue').textContent = config.speed || 1.0;
        document.getElementById('pitchValue').textContent = config.pitch || 0;
        document.getElementById('volValue').textContent = config.vol || 1.0;
        
    } catch (error) {
        console.error('加载配置失败:', error);
        showMessage('加载配置失败', 'error');
    }
}

// 保存配置
async function saveSettings() {
    const config = {
        group_id: document.getElementById('groupId').value,
        api_key: document.getElementById('apiKey').value,
        model: document.getElementById('model').value,
        voice_id: document.getElementById('voiceId').value,
        emotion: document.getElementById('emotion').value,
        speed: parseFloat(document.getElementById('speed').value),
        pitch: parseInt(document.getElementById('pitch').value),
        vol: parseFloat(document.getElementById('vol').value)
    };
    
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('配置保存成功！', 'success');
            toggleSettings();
        } else {
            showMessage(result.message || '配置保存失败', 'error');
        }
    } catch (error) {
        console.error('保存配置失败:', error);
        showMessage('保存配置失败', 'error');
    }
}

// 重置设置
function resetSettings() {
    if (confirm('确定要重置所有设置吗？')) {
        document.getElementById('groupId').value = '';
        document.getElementById('apiKey').value = '';
        document.getElementById('model').value = 'speech-2.5-hd-preview';
        document.getElementById('voiceId').value = 'Boyan_new_platform';
        document.getElementById('emotion').value = 'neutral';
        document.getElementById('speed').value = 1.0;
        document.getElementById('pitch').value = 0;
        document.getElementById('vol').value = 1.0;
        
        document.getElementById('speedValue').textContent = '1.0';
        document.getElementById('pitchValue').textContent = '0';
        document.getElementById('volValue').textContent = '1.0';
        
        showMessage('设置已重置', 'info');
    }
}

// 加载新闻
async function loadNews() {
    const newsContent = document.getElementById('newsContent');
    const generateBtn = document.getElementById('generateBtn');
    
    try {
        newsContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载最新新闻...</span>
            </div>
        `;
        
        const response = await fetch('/api/news');
        const result = await response.json();
        
        if (result.success) {
            // 保存原始新闻内容用于复制
            currentNewsContent = result.content;
            
            // 格式化新闻内容显示
            const lines = result.content.split('\n');
            let htmlContent = '';
            
            if (lines.length > 0) {
                // 第一行作为标题
                htmlContent += `<div class="news-title">${lines[0]}</div>`;
                
                // 从第三行开始是新闻项目（跳过空行）
                if (lines.length > 2) {
                    htmlContent += '<div class="news-items">';
                    for (let i = 2; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            htmlContent += `<div class="news-item">${lines[i]}</div>`;
                        }
                    }
                    htmlContent += '</div>';
                }
            }
            
            newsContent.innerHTML = htmlContent;
            
            // 更新时间戳
            const timestamp = new Date(result.timestamp).toLocaleString('zh-CN');
            document.getElementById('newsTimestamp').textContent = `更新时间: ${timestamp}`;
            
            // 启用生成和复制按钮
            generateBtn.disabled = false;
            document.getElementById('copyBtn').disabled = false;
            
            showMessage('新闻加载成功！', 'success');
        } else {
            newsContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>加载新闻失败: ${result.message}</span>
                    <button class="btn btn-primary" onclick="loadNews()" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i>
                        重新加载
                    </button>
                </div>
            `;
            showMessage(result.message || '加载新闻失败', 'error');
        }
    } catch (error) {
        console.error('加载新闻失败:', error);
        newsContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>网络错误，请检查网络连接</span>
                <button class="btn btn-primary" onclick="loadNews()" style="margin-top: 15px;">
                    <i class="fas fa-sync-alt"></i>
                    重新加载
                </button>
            </div>
        `;
        showMessage('网络错误，请检查网络连接', 'error');
    }
}

// 刷新新闻
async function refreshNews() {
    // 重置音频相关状态
    currentAudioData = null;
    currentFilename = null;
    currentShareUrl = null;
    currentNewsContent = null;
    
    const playBtn = document.getElementById('playBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const copyBtn = document.getElementById('copyBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const generateBtn = document.getElementById('generateBtn');
    const newsContent = document.getElementById('newsContent');
    
    playBtn.disabled = true;
    downloadBtn.disabled = true;
    shareBtn.disabled = true;
    shareBtn.style.display = 'none';
    copyBtn.disabled = true;
    generateBtn.disabled = true;
    audioPlayer.style.display = 'none';
    
    try {
        // 显示加载状态
        newsContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在清除缓存并获取最新新闻...</span>
            </div>
        `;
        
        // 调用强制刷新API（清除缓存）
        const response = await fetch('/api/refresh-news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 保存原始新闻内容用于复制
            currentNewsContent = result.content;
            
            // 格式化新闻内容显示
            const lines = result.content.split('\n');
            let htmlContent = '';
            
            if (lines.length > 0) {
                // 第一行作为标题
                htmlContent += `<div class="news-title">${lines[0]}</div>`;
                
                // 从第三行开始是新闻项目（跳过空行）
                if (lines.length > 2) {
                    htmlContent += '<div class="news-items">';
                    for (let i = 2; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            htmlContent += `<div class="news-item">${lines[i]}</div>`;
                        }
                    }
                    htmlContent += '</div>';
                }
            }
            
            newsContent.innerHTML = htmlContent;
            
            // 更新时间戳
            const timestamp = new Date(result.timestamp).toLocaleString('zh-CN');
            document.getElementById('newsTimestamp').textContent = `更新时间: ${timestamp} (已清除缓存)`;
            
            // 启用生成和复制按钮
            generateBtn.disabled = false;
            copyBtn.disabled = false;
            
            showMessage('新闻已刷新！缓存已清除，获取到最新内容', 'success');
        } else {
            newsContent.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>刷新失败: ${result.message || '未知错误'}</span>
                </div>
            `;
            showMessage('刷新新闻失败: ' + (result.message || '请检查网络连接'), 'error');
        }
    } catch (error) {
        console.error('刷新新闻失败:', error);
        newsContent.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>网络连接失败，请检查网络后重试</span>
            </div>
        `;
        showMessage('刷新新闻失败，请检查网络连接', 'error');
    }
}

// 强制刷新新闻（忽略缓存）
async function forceRefreshNews() {
    // 重置音频相关状态
    currentAudioData = null;
    currentFilename = null;
    currentShareUrl = null;
    currentNewsContent = null;
    
    const playBtn = document.getElementById('playBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const copyBtn = document.getElementById('copyBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const newsContent = document.getElementById('newsContent');
    
    playBtn.disabled = true;
    downloadBtn.disabled = true;
    shareBtn.disabled = true;
    shareBtn.style.display = 'none';
    copyBtn.disabled = true;
    audioPlayer.style.display = 'none';
    
    try {
        newsContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在强制刷新最新新闻...</span>
            </div>
        `;
        
        const response = await fetch('/api/refresh-news', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 保存原始新闻内容用于复制
            currentNewsContent = result.content;
            
            // 格式化新闻内容显示
            const lines = result.content.split('\n');
            let htmlContent = '';
            
            if (lines.length > 0) {
                // 第一行作为标题
                htmlContent += `<div class="news-title">${lines[0]}</div>`;
                
                // 从第三行开始是新闻项目（跳过空行）
                if (lines.length > 2) {
                    htmlContent += '<div class="news-items">';
                    for (let i = 2; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            htmlContent += `<div class="news-item">${lines[i]}</div>`;
                        }
                    }
                    htmlContent += '</div>';
                }
            }
            
            newsContent.innerHTML = htmlContent;
            
            // 更新时间戳
            const timestamp = new Date(result.timestamp).toLocaleString('zh-CN');
            document.getElementById('newsTimestamp').textContent = `更新时间: ${timestamp}`;
            
            // 启用生成和复制按钮
            document.getElementById('generateBtn').disabled = false;
            document.getElementById('copyBtn').disabled = false;
            
            showMessage(result.message || '新闻刷新成功！', 'success');
        } else {
            newsContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>强制刷新失败: ${result.message}</span>
                    <button class="btn btn-primary" onclick="forceRefreshNews()" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i>
                        重新尝试
                    </button>
                </div>
            `;
            showMessage(result.message || '强制刷新失败', 'error');
        }
    } catch (error) {
        console.error('强制刷新失败:', error);
        newsContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>网络错误，请检查网络连接</span>
                <button class="btn btn-primary" onclick="forceRefreshNews()" style="margin-top: 15px;">
                    <i class="fas fa-sync-alt"></i>
                    重新尝试
                </button>
            </div>
        `;
        showMessage('网络错误，请检查网络连接', 'error');
    }
}

// 一键复制新闻内容
function copyNews() {
    if (!currentNewsContent) {
        showMessage('没有新闻内容可以复制', 'error');
        return;
    }
    
    try {
        // 使用现代的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(currentNewsContent).then(() => {
                showMessage('新闻内容已复制到剪贴板！', 'success');
                
                // 视觉反馈
                const copyBtn = document.getElementById('copyBtn');
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i><span>已复制</span>';
                copyBtn.style.background = 'var(--gradient-accent)';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.background = '';
                }, 2000);
                
            }).catch(err => {
                console.error('复制失败:', err);
                fallbackCopyTextToClipboard(currentNewsContent);
            });
        } else {
            // 降级方案
            fallbackCopyTextToClipboard(currentNewsContent);
        }
    } catch (error) {
        console.error('复制操作失败:', error);
        showMessage('复制失败，请手动选择文本复制', 'error');
    }
}

// 降级复制方案
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 避免滚动到底部
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showMessage('新闻内容已复制到剪贴板！', 'success');
            
            // 视觉反馈
            const copyBtn = document.getElementById('copyBtn');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i><span>已复制</span>';
            copyBtn.style.background = 'var(--gradient-accent)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = '';
            }, 2000);
        } else {
            showMessage('复制失败，请手动选择文本复制', 'error');
        }
    } catch (err) {
        console.error('降级复制失败:', err);
        showMessage('复制失败，请手动选择文本复制', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 加载历史记录列表
async function loadHistoryList() {
    const historyDateList = document.getElementById('historyDateList');
    
    try {
        historyDateList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载历史记录...</span>
            </div>
        `;
        
        const response = await fetch('/api/history');
        const result = await response.json();
        
        if (result.success && result.history.length > 0) {
            let historyHTML = '';
            
            result.history.forEach((item, index) => {
                const date = new Date(item.cached_time);
                const formattedTime = date.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // 获取前2条新闻作为预览
                const previewItems = item.news_items.slice(0, 2);
                const preview = previewItems.map((newsItem, idx) => {
                    // 转义HTML特殊字符并截断长度
                    const escapedItem = newsItem.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                    return `${idx + 1}、${escapedItem.substring(0, 40)}...`;
                }).join('<br>');
                
                historyHTML += `
                    <div class="history-date-item" data-cache-date="${item.cache_date}">
                        <div class="history-date-header">
                            <div class="history-date-title">${item.date_str}</div>
                            <div class="history-date-time">${formattedTime}</div>
                        </div>
                        <div class="history-date-preview">${preview}</div>
                        <div class="history-date-actions">
                            <button class="history-date-btn primary" data-action="view" data-cache-date="${item.cache_date}">
                                <i class="fas fa-eye"></i>
                                查看详情
                            </button>
                        </div>
                    </div>
                `;
            });
            
            historyDateList.innerHTML = historyHTML;
            
            // 添加事件委托
            setupHistoryPanelEventListeners();
        } else {
            historyDateList.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-file-alt"></i>
                    <div>暂无历史记录</div>
                    <div style="margin-top: 10px; font-size: 14px;">开始使用AI早报，记录将自动保存</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('加载历史记录失败:', error);
        historyDateList.innerHTML = `
            <div class="no-history">
                <i class="fas fa-exclamation-triangle"></i>
                <div>加载历史记录失败</div>
                <div style="margin-top: 10px; font-size: 14px;">请检查网络连接后重试</div>
            </div>
        `;
    }
}

// 设置历史记录面板事件监听器
function setupHistoryPanelEventListeners() {
    const historyDateList = document.getElementById('historyDateList');
    
    // 移除之前的监听器
    historyDateList.removeEventListener('click', handleHistoryPanelClick);
    
    // 添加事件委托
    historyDateList.addEventListener('click', handleHistoryPanelClick);
}

// 处理历史记录面板点击事件
function handleHistoryPanelClick(e) {
    const target = e.target.closest('[data-cache-date]');
    if (!target) return;
    
    const cacheDate = target.getAttribute('data-cache-date');
    const action = target.getAttribute('data-action');
    
    if (action === 'view') {
        e.stopPropagation();
        showHistoryDetail(cacheDate);
    } else if (target.classList.contains('history-date-item')) {
        // 点击整个日期项目
        showHistoryDetail(cacheDate);
    }
}

// 显示历史记录详情模态框
async function showHistoryDetail(cacheDate) {
    const modal = document.getElementById('historyDetailModal');
    const title = document.getElementById('historyDetailTitle');
    const content = document.getElementById('historyDetailContent');
    
    try {
        // 显示模态框
        modal.style.display = 'flex';
        
        // 设置加载状态
        content.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>正在加载详细内容...</span>
            </div>
        `;
        
        const response = await fetch(`/api/history/${cacheDate}`);
        const result = await response.json();
        
        if (result.success) {
            // 更新标题
            title.innerHTML = `
                <i class="fas fa-calendar-day"></i>
                ${result.date_str} 早报详情
            `;
            
            // 解析并显示内容
            const lines = result.content.split('\n').filter(line => line.trim());
            const dateMatch = lines[0];
            const newsItems = lines.slice(1);
            
            let contentHTML = `<div class="news-title">${dateMatch}</div>`;
            newsItems.forEach((item, index) => {
                if (item.trim()) {
                    contentHTML += `<div class="news-item">${item}</div>`;
                }
            });
            
            content.innerHTML = contentHTML;
            
            // 存储当前详情数据以供其他操作使用
            window.currentHistoryDetail = {
                content: result.content,
                date_str: result.date_str,
                news_items: result.news_items || newsItems
            };
        } else {
            content.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>加载失败</div>
                    <div style="margin-top: 10px; font-size: 14px;">${result.message || '请重试'}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('显示历史记录详情失败:', error);
        content.innerHTML = `
            <div class="no-history">
                <i class="fas fa-exclamation-triangle"></i>
                <div>加载失败</div>
                <div style="margin-top: 10px; font-size: 14px;">网络连接异常，请重试</div>
            </div>
        `;
    }
}

// 隐藏历史记录详情模态框
function hideHistoryDetail() {
    const modal = document.getElementById('historyDetailModal');
    modal.style.display = 'none';
    window.currentHistoryDetail = null;
}

// 复制历史记录详情内容
function copyHistoryDetail() {
    if (!window.currentHistoryDetail) {
        showMessage('没有可复制的内容', 'error');
        return;
    }
    
    const content = window.currentHistoryDetail.content;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(content).then(() => {
            showMessage('历史记录内容已复制到剪贴板！', 'success');
        }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyTextToClipboard(content);
        });
    } else {
        fallbackCopyTextToClipboard(content);
    }
}

// 将历史记录加载到主界面
function loadHistoryToMain() {
    if (!window.currentHistoryDetail) {
        showMessage('没有可加载的内容', 'error');
        return;
    }
    
    const { content, date_str } = window.currentHistoryDetail;
    
    // 解析并显示内容到主界面
    const newsContent = document.getElementById('newsContent');
    const newsTimestamp = document.getElementById('newsTimestamp');
    
    const lines = content.split('\n').filter(line => line.trim());
    const dateMatch = lines[0];
    const newsItems = lines.slice(1);
    
    let contentHTML = `<div class="news-title">${dateMatch}</div>`;
    newsItems.forEach((item, index) => {
        if (item.trim()) {
            contentHTML += `<div class="news-item">${item}</div>`;
        }
    });
    
    newsContent.innerHTML = contentHTML;
    newsTimestamp.textContent = `加载时间: ${new Date().toLocaleString('zh-CN')} (历史记录)`;
    
    // 更新当前新闻内容
    currentNewsContent = content;
    
    // 启用复制按钮
    document.getElementById('copyBtn').disabled = false;
    
    // 隐藏模态框和面板
    hideHistoryDetail();
    toggleHistory(); // 关闭历史记录面板
    
    showMessage(`${date_str} 早报已加载到主界面`, 'success');
}

// 兼容旧版本的函数（保留以防其他地方调用）
async function viewHistory(cacheDate) {
    showHistoryDetail(cacheDate);
}

// 兼容旧版本的函数（保留以防其他地方调用）
async function copyHistoryNews(cacheDate) {
    try {
        const response = await fetch(`/api/history/${cacheDate}`);
        const result = await response.json();
        
        if (result.success) {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(result.content);
                showMessage('历史记录已复制到剪贴板！', 'success');
            } else {
                fallbackCopyTextToClipboard(result.content);
            }
        } else {
            showMessage('复制失败', 'error');
        }
    } catch (error) {
        console.error('复制历史记录失败:', error);
        showMessage('复制失败', 'error');
    }
}

// 兼容旧版本的函数（保留以防其他地方调用）
function showHistory() {
    toggleHistory();
}

// 兼容旧版本的函数（保留以防其他地方调用）
function hideHistory() {
    const panel = document.getElementById('historyPanel');
    if (panel.classList.contains('active')) {
        toggleHistory();
    }
}

// 生成音频
async function generateAudio() {
    if (isGenerating) return;
    
    if (!currentNewsContent) {
        showMessage('没有新闻内容可以转换', 'error');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    const playBtn = document.getElementById('playBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioGeneration = document.getElementById('audioGeneration');
    
    try {
        isGenerating = true;
        
        // 隐藏音频播放器
        audioPlayer.style.display = 'none';
        
        // 显示生成进度
        audioGeneration.style.display = 'block';
        
        // 更新按钮状态
        generateBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>生成中...</span>
        `;
        generateBtn.disabled = true;
        
        // 开始进度模拟
        startProgressSimulation();
        
        const response = await fetch('/api/generate-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: currentNewsContent
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 完成进度条
            completeProgress();
            
            currentAudioData = result.audio_data;
            currentFilename = result.filename;
            currentShareUrl = result.share_url;
            
            // 延迟一秒后显示音频播放器
            setTimeout(() => {
                // 隐藏生成进度
                audioGeneration.style.display = 'none';
                
                // 创建音频URL并设置到播放器
                const audioBlob = new Blob([Uint8Array.from(atob(currentAudioData), c => c.charCodeAt(0))], {type: 'audio/mp3'});
                const audioUrl = URL.createObjectURL(audioBlob);
                const audioElement = document.getElementById('audioElement');
                audioElement.src = audioUrl;
                
                // 显示音频播放器
                audioPlayer.style.display = 'block';
                
                // 启用播放、下载和分享按钮
                playBtn.disabled = false;
                downloadBtn.disabled = false;
                
                const shareBtn = document.getElementById('shareBtn');
                shareBtn.disabled = false;
                shareBtn.style.display = 'inline-flex';
                
                showMessage('音频生成成功！可以播放、下载或分享', 'success');
            }, 1000);
            
        } else {
            // 隐藏生成进度
            audioGeneration.style.display = 'none';
            showMessage(result.message || '音频生成失败', 'error');
        }
        
    } catch (error) {
        console.error('生成音频失败:', error);
        // 隐藏生成进度
        audioGeneration.style.display = 'none';
        showMessage('音频生成失败', 'error');
    } finally {
        isGenerating = false;
        
        // 恢复按钮状态
        generateBtn.innerHTML = `
            <i class="fas fa-microphone"></i>
            <span>生成语音</span>
        `;
        generateBtn.disabled = false;
    }
}

// 开始进度模拟
function startProgressSimulation() {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressTime = document.getElementById('progressTime');
    const generationText = document.getElementById('generationText');
    
    let progress = 0;
    let stage = 0;
    const stages = [
        { text: '正在连接Minimax AI服务...', duration: 2000 },
        { text: '正在分析文本内容...', duration: 3000 },
        { text: '正在生成语音数据...', duration: 8000 },
        { text: '正在优化音频质量...', duration: 2000 },
        { text: '即将完成...', duration: 1000 }
    ];
    
    let startTime = Date.now();
    let totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    
    function updateProgress() {
        if (!isGenerating) return;
        
        const elapsed = Date.now() - startTime;
        const currentStage = stages[stage];
        
        if (elapsed < totalDuration) {
            // 计算当前阶段的进度
            let stageStart = 0;
            for (let i = 0; i < stage; i++) {
                stageStart += stages[i].duration;
            }
            
            let stageProgress = Math.min((elapsed - stageStart) / currentStage.duration, 1);
            let totalProgress = (stageStart + stageProgress * currentStage.duration) / totalDuration;
            
            progress = Math.min(totalProgress * 90, 90); // 最大到90%，最后10%由完成函数处理
            
            progressFill.style.width = progress + '%';
            progressPercent.textContent = Math.round(progress) + '%';
            
            // 更新预计时间
            let remaining = totalDuration - elapsed;
            let minutes = Math.floor(remaining / 60000);
            let seconds = Math.ceil((remaining % 60000) / 1000);
            progressTime.textContent = `预计时间: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // 更新状态文本
            generationText.textContent = currentStage.text;
            
            // 检查是否需要进入下一阶段
            if (elapsed >= stageStart + currentStage.duration && stage < stages.length - 1) {
                stage++;
            }
            
            setTimeout(updateProgress, 200);
        }
    }
    
    updateProgress();
}

// 完成进度条
function completeProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressTime = document.getElementById('progressTime');
    const generationText = document.getElementById('generationText');
    const generationStatus = document.getElementById('generationStatus');
    
    // 完成到100%
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    progressTime.textContent = '已完成';
    generationText.textContent = '音频生成完成！';
    
    // 更改状态图标
    generationStatus.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span id="generationText">音频生成完成！</span>
    `;
}

// 播放音频
function playAudio() {
    if (!currentAudioData) {
        showMessage('请先生成音频', 'error');
        return;
    }
    
    try {
        // 将base64数据转换为Blob
        const audioBytes = atob(currentAudioData);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
            audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 显示音频播放器
        const audioPlayer = document.getElementById('audioPlayer');
        const audioElement = document.getElementById('audioElement');
        
        audioElement.src = audioUrl;
        audioPlayer.style.display = 'block';
        
        // 自动播放
        audioElement.play().catch(e => {
            console.error('播放失败:', e);
            showMessage('播放失败，请手动点击播放按钮', 'error');
        });
        
        showMessage('开始播放音频', 'success');
        
    } catch (error) {
        console.error('播放音频失败:', error);
        showMessage('播放音频失败', 'error');
    }
}

// 下载音频
async function downloadAudio() {
    if (!currentAudioData || !currentFilename) {
        showMessage('请先生成音频', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/download-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio_data: currentAudioData,
                filename: currentFilename
            })
        });
        
        if (response.ok) {
            // 创建下载链接
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showMessage('音频下载成功！', 'success');
        } else {
            const result = await response.json();
            showMessage(result.message || '下载失败', 'error');
        }
        
    } catch (error) {
        console.error('下载音频失败:', error);
        showMessage('下载音频失败', 'error');
    }
}

// 工具函数：格式化时间
function formatTime(date) {
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 键盘快捷键
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter 生成音频
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating) {
            generateAudio();
        }
    }
    
    // Ctrl/Cmd + C 复制新闻
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (currentNewsContent) {
            e.preventDefault();
            copyNews();
        }
    }
    
    // ESC 关闭设置面板和历史记录面板
    if (e.key === 'Escape') {
        const settingsPanel = document.getElementById('settingsPanel');
        const historyPanel = document.getElementById('historyPanel');
        
        if (settingsPanel.classList.contains('active')) {
            toggleSettings();
        } else if (historyPanel.style.display === 'flex') {
            hideHistory();
        }
    }
    
    // F5 刷新新闻
    if (e.key === 'F5') {
        e.preventDefault();
        refreshNews();
    }
});

// 分享音频
function shareAudio() {
    if (!currentShareUrl) {
        showMessage('没有可分享的音频', 'error');
        return;
    }
    
    try {
        // 生成完整的分享链接
        const fullUrl = window.location.origin + currentShareUrl;
        
        // 使用现代的 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(fullUrl).then(() => {
                showMessage('音频分享链接已复制到剪贴板！', 'success');
                
                // 视觉反馈
                const shareBtn = document.getElementById('shareBtn');
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = '<i class="fas fa-check"></i><span>已复制</span>';
                shareBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.style.background = '';
                }, 2000);
                
            }).catch(err => {
                console.error('复制失败:', err);
                fallbackCopyTextToClipboard(fullUrl);
            });
        } else {
            // 降级方案
            fallbackCopyTextToClipboard(fullUrl);
        }
    } catch (error) {
        console.error('分享音频失败:', error);
        showMessage('分享失败', 'error');
    }
}
