from flask import Flask, render_template, request, jsonify, send_file, session
import asyncio
import re
import requests
import json
import os
import base64
from datetime import datetime
from crawl4ai import AsyncWebCrawler
import secrets
import io

app = Flask(__name__, static_url_path='/aizaobao/static')
# 从环境变量读取secret key，如果没有则生成一个临时的
app.secret_key = os.getenv('SECRET_KEY') or secrets.token_hex(16)

# 配置应用根路径，确保 URL 生成正确
app.config['APPLICATION_ROOT'] = '/aizaobao'

# 默认配置
DEFAULT_CONFIG = {
    'group_id': '',
    'api_key': '',
    'model': 'speech-2.5-hd-preview',
    'voice_id': 'Boyan_new_platform',
    'speed': 1.0,
    'pitch': 0,
    'vol': 1.0,
    'emotion': 'neutral',
    'sample_rate': 32000,
    'bitrate': 128000,
    'format': 'mp3'
}

def get_user_config():
    """获取用户配置"""
    config = session.get('config', DEFAULT_CONFIG.copy())
    return config

def update_user_config(new_config):
    """更新用户配置"""
    config = get_user_config()
    config.update(new_config)
    session['config'] = config
    return config

def format_news(markdown_content):
    """
    从爬取的内容中提取新闻标题并格式化为指定格式
    """
    # 尝试提取日期
    date_match = re.search(r'每日AI早报\s+(\d+)/(\d+)', markdown_content)
    if date_match:
        month, day = date_match.groups()
        current_year = datetime.now().year
        date_str = f"{current_year}年{month.zfill(2)}月{day.zfill(2)}日"
    else:
        date_str = datetime.now().strftime("%Y年%m月%d日")
    
    # 提取新闻条目
    news_items = re.findall(r'\[\d+\s*\.\s*(.*?)\]', markdown_content)
    
    # 格式化输出 - 标题单独一行，每个新闻项目之间空一行
    formatted_output = f"{date_str} AI科技早报\n\n"
    for i, item in enumerate(news_items[:10], 1):
        formatted_output += f"{i}、{item}\n\n"
    
    # 去除最后的多余换行符
    formatted_output = formatted_output.rstrip('\n')
    
    return formatted_output, news_items[:10], date_str

def remove_newlines(text):
    """
    去除文本中的换行符，用于API调用
    """
    return text.replace('\n', '').replace('\r', '')

def create_cache_folder():
    """创建缓存文件夹"""
    cache_folder = "cache"
    if not os.path.exists(cache_folder):
        os.makedirs(cache_folder)
    return cache_folder

def get_cache_file_path():
    """获取当天的缓存文件路径"""
    cache_folder = create_cache_folder()
    today = datetime.now().strftime("%Y-%m-%d")
    return os.path.join(cache_folder, f"news_{today}.json")

def save_news_cache(formatted_news, news_items, date_str):
    """保存新闻缓存"""
    try:
        cache_file = get_cache_file_path()
        cache_data = {
            'formatted_news': formatted_news,
            'news_items': news_items,
            'date_str': date_str,
            'cached_time': datetime.now().isoformat(),
            'cache_date': datetime.now().strftime("%Y-%m-%d")
        }
        
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
        
        print(f"新闻缓存已保存: {cache_file}")
        return True
    except Exception as e:
        print(f"保存缓存失败: {e}")
        return False

def load_news_cache():
    """加载新闻缓存"""
    try:
        cache_file = get_cache_file_path()
        
        # 检查缓存文件是否存在
        if not os.path.exists(cache_file):
            print("缓存文件不存在")
            return None, None, None
        
        # 检查缓存文件是否为今天的
        today = datetime.now().strftime("%Y-%m-%d")
        
        with open(cache_file, 'r', encoding='utf-8') as f:
            cache_data = json.load(f)
        
        # 验证缓存日期
        if cache_data.get('cache_date') != today:
            print("缓存已过期")
            return None, None, None
        
        print(f"从缓存加载新闻: {cache_file}")
        return cache_data['formatted_news'], cache_data['news_items'], cache_data['date_str']
        
    except Exception as e:
        print(f"加载缓存失败: {e}")
        return None, None, None

def clear_old_cache():
    """清理旧的缓存文件（保留最近3天）"""
    try:
        cache_folder = create_cache_folder()
        current_time = datetime.now()
        
        for filename in os.listdir(cache_folder):
            if filename.startswith('news_') and filename.endswith('.json'):
                file_path = os.path.join(cache_folder, filename)
                # 获取文件修改时间
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                # 如果文件超过3天，删除它
                if (current_time - file_time).days > 3:
                    os.remove(file_path)
                    print(f"删除旧缓存文件: {filename}")
    except Exception as e:
        print(f"清理缓存失败: {e}")

async def get_news_content():
    """获取AI新闻内容（带缓存机制）"""
    # 先尝试从缓存加载
    cached_news, cached_items, cached_date = load_news_cache()
    
    if cached_news is not None:
        print("使用缓存的新闻内容")
        return cached_news, cached_items, cached_date
    
    # 缓存不存在或已过期，从网络获取
    print("从网络获取最新新闻")
    try:
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(
                url="https://www.aicpb.com/news",
                bypass_cache=True,
            )
            
            formatted_news, news_items, date_str = format_news(result.markdown)
            
            # 保存到缓存
            save_news_cache(formatted_news, news_items, date_str)
            
            # 清理旧缓存
            clear_old_cache()
            
            return formatted_news, news_items, date_str
            
    except Exception as e:
        print(f"获取新闻失败: {e}")
        return None, None, None

def create_audio_folder():
    """创建音频文件夹"""
    audio_folder = "static/audio"
    if not os.path.exists(audio_folder):
        os.makedirs(audio_folder)
    return audio_folder

def generate_audio(text, config):
    """调用Minimax API生成音频"""
    if not config.get('group_id') or not config.get('api_key'):
        return None, "请先配置Minimax API信息", None
    
    url = f"https://api.minimax.chat/v1/t2a_v2?GroupId={config['group_id']}"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": config.get('model', 'speech-2.5-hd-preview'),
        "text": text,
        "timber_weights": [
            {
                "voice_id": config.get('voice_id', 'Boyan_new_platform'),
                "weight": 100
            }
        ],
        "voice_setting": {
            "voice_id": "",
            "speed": config.get('speed', 1.0),
            "pitch": config.get('pitch', 0),
            "vol": config.get('vol', 1.0),
            "emotion": config.get('emotion', 'neutral'),
            "latex_read": False
        },
        "audio_setting": {
            "sample_rate": config.get('sample_rate', 32000),
            "bitrate": config.get('bitrate', 128000),
            "format": config.get('format', 'mp3')
        },
        "language_boost": "auto"
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            response_data = response.json()
            
            if response_data.get("base_resp", {}).get("status_code") == 0:
                audio_data = response_data.get("data", {}).get("audio")
                
                if audio_data:
                    # 将十六进制字符串转换为二进制数据
                    try:
                        audio_bytes = bytes.fromhex(audio_data)
                        
                        # 保存音频文件到静态目录，以便分享
                        audio_folder = create_audio_folder()
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"ai_news_{timestamp}.mp3"
                        file_path = os.path.join(audio_folder, filename)
                        
                        with open(file_path, 'wb') as f:
                            f.write(audio_bytes)
                        
                        # 生成分享URL
                        share_url = f"/aizaobao/static/audio/{filename}"
                        
                        return audio_bytes, None, share_url
                    except Exception as e:
                        return None, f"音频数据解析失败: {str(e)}", None
                else:
                    return None, "API返回的音频数据为空", None
            else:
                error_msg = response_data.get("base_resp", {}).get("status_msg", "未知错误")
                return None, f"API调用失败: {error_msg}", None
        else:
            return None, f"HTTP请求失败: {response.status_code}", None
            
    except Exception as e:
        return None, f"请求异常: {str(e)}", None

@app.route('/aizaobao/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/aizaobao/api/config', methods=['GET', 'POST'])
def config_api():
    """配置API"""
    if request.method == 'GET':
        config = get_user_config()
        # 不返回API密钥的完整信息
        safe_config = config.copy()
        if safe_config.get('api_key'):
            safe_config['api_key'] = safe_config['api_key'][:10] + '...' if len(safe_config['api_key']) > 10 else safe_config['api_key']
        return jsonify(safe_config)
    
    elif request.method == 'POST':
        try:
            new_config = request.json
            config = update_user_config(new_config)
            return jsonify({'success': True, 'message': '配置更新成功'})
        except Exception as e:
            return jsonify({'success': False, 'message': f'配置更新失败: {str(e)}'})

@app.route('/aizaobao/api/news')
def get_news():
    """获取新闻API"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        news_content, news_items, date_str = loop.run_until_complete(get_news_content())
        loop.close()
        
        if news_content:
            # 检查是否来自缓存
            cache_file = get_cache_file_path()
            is_cached = os.path.exists(cache_file)
            
            return jsonify({
                'success': True,
                'content': news_content,
                'items': news_items,
                'date_str': date_str,
                'timestamp': datetime.now().isoformat(),
                'from_cache': is_cached
            })
        else:
            return jsonify({'success': False, 'message': '获取新闻失败'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取新闻异常: {str(e)}'})

@app.route('/aizaobao/api/refresh-news', methods=['POST'])
def refresh_news():
    """强制刷新新闻（忽略缓存）"""
    try:
        # 删除当天的缓存文件
        cache_file = get_cache_file_path()
        if os.path.exists(cache_file):
            os.remove(cache_file)
            print(f"删除缓存文件: {cache_file}")
        
        # 重新获取新闻
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        news_content, news_items, date_str = loop.run_until_complete(get_news_content())
        loop.close()
        
        if news_content:
            return jsonify({
                'success': True,
                'content': news_content,
                'items': news_items,
                'date_str': date_str,
                'timestamp': datetime.now().isoformat(),
                'from_cache': False,
                'message': '新闻已强制刷新'
            })
        else:
            return jsonify({'success': False, 'message': '强制刷新失败'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'强制刷新异常: {str(e)}'})

@app.route('/aizaobao/api/history')
def get_history():
    """获取历史记录列表"""
    try:
        cache_folder = create_cache_folder()
        history_files = []
        
        # 扫描缓存目录中的所有新闻文件
        for filename in os.listdir(cache_folder):
            if filename.startswith('news_') and filename.endswith('.json'):
                file_path = os.path.join(cache_folder, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                    
                    history_files.append({
                        'cache_date': cache_data.get('cache_date'),
                        'date_str': cache_data.get('date_str'),
                        'cached_time': cache_data.get('cached_time'),
                        'news_items': cache_data.get('news_items', []),
                        'filename': filename
                    })
                except Exception as e:
                    print(f"读取历史文件失败 {filename}: {e}")
                    continue
        
        # 按日期倒序排列
        history_files.sort(key=lambda x: x['cache_date'], reverse=True)
        
        return jsonify({
            'success': True,
            'history': history_files
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取历史记录失败: {str(e)}'})

@app.route('/aizaobao/api/history/<cache_date>')
def get_history_detail(cache_date):
    """获取特定日期的历史记录详情"""
    try:
        cache_folder = create_cache_folder()
        cache_file = os.path.join(cache_folder, f"news_{cache_date}.json")
        
        if not os.path.exists(cache_file):
            return jsonify({'success': False, 'message': '历史记录不存在'})
        
        with open(cache_file, 'r', encoding='utf-8') as f:
            cache_data = json.load(f)
        
        return jsonify({
            'success': True,
            'content': cache_data.get('formatted_news'),
            'items': cache_data.get('news_items'),
            'date_str': cache_data.get('date_str'),
            'cached_time': cache_data.get('cached_time'),
            'cache_date': cache_data.get('cache_date')
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'获取历史记录详情失败: {str(e)}'})

@app.route('/aizaobao/api/generate-audio', methods=['POST'])
def generate_audio_api():
    """生成音频API"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'success': False, 'message': '文本内容不能为空'})
        
        config = get_user_config()
        
        # 去除换行符用于API调用
        clean_text = remove_newlines(text)
        
        audio_bytes, error, share_url = generate_audio(clean_text, config)
        
        if audio_bytes:
            # 将音频数据编码为base64
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            return jsonify({
                'success': True,
                'audio_data': audio_base64,
                'filename': f"ai_news_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3",
                'share_url': share_url
            })
        else:
            return jsonify({'success': False, 'message': error})
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'生成音频异常: {str(e)}'})

@app.route('/aizaobao/api/download-audio', methods=['POST'])
def download_audio():
    """下载音频文件"""
    try:
        data = request.json
        audio_data = data.get('audio_data', '')
        filename = data.get('filename', 'ai_news.mp3')
        
        if not audio_data:
            return jsonify({'success': False, 'message': '音频数据为空'})
        
        # 解码base64音频数据
        audio_bytes = base64.b64decode(audio_data)
        
        # 创建内存文件对象
        audio_file = io.BytesIO(audio_bytes)
        audio_file.seek(0)
        
        return send_file(
            audio_file,
            as_attachment=True,
            download_name=filename,
            mimetype='audio/mpeg'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'下载失败: {str(e)}'})

@app.route('/aizaobao/static/<path:filename>')
def serve_static_files(filename):
    """处理静态文件请求（音频文件分享）"""
    try:
        # 构建文件路径
        file_path = os.path.join('static', filename)
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            return jsonify({'error': '文件不存在'}), 404
        
        # 返回文件
        return send_file(
            file_path,
            as_attachment=False,  # 不强制下载，可以在浏览器中播放
            mimetype='audio/mpeg' if filename.endswith('.mp3') else None
        )
        
    except Exception as e:
        return jsonify({'error': f'访问文件失败: {str(e)}'}), 500

if __name__ == '__main__':
    # 创建templates、static、cache和audio目录
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    os.makedirs('static/audio', exist_ok=True)
    os.makedirs('cache', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=6888)
