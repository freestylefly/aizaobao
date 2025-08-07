# Gunicorn配置文件

import os

# 服务器配置
bind = f"0.0.0.0:{os.getenv('PORT', '6888')}"
# 使用单个worker避免playwright浏览器冲突
workers = int(os.getenv('WORKERS', '1'))
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
# 增加超时时间以支持网页爬取任务
timeout = int(os.getenv('TIMEOUT', '300'))
keepalive = 2

# 日志配置
accesslog = '-'
errorlog = '-'
loglevel = os.getenv('LOG_LEVEL', 'info').lower()
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 进程配置
preload_app = True
daemon = False
pidfile = '/tmp/gunicorn.pid'
tmp_upload_dir = None

# 安全配置
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# 性能配置
worker_tmp_dir = '/dev/shm'
