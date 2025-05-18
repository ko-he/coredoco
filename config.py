import os
from dotenv import load_dotenv

ENVIRONMENT = os.getenv('ENVIRONMENT')

if ENVIRONMENT == 'development':
    # .envファイルから環境変数を読み込む
    load_dotenv()

# APIキーの設定
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")