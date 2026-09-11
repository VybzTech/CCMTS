DB_URL = "mysql+pymysql://dlts_user:dlts_password@127.0.0.1:3306/dlts_db"
REDIS_HOST = 'localhost'
REDIS_PORT = 6380
QUEUE_PREFIX = "bull:allocation-tasks"
QUEUE_WAIT = f"{QUEUE_PREFIX}:wait"