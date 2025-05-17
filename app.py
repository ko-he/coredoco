import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import io
from config import GEMINI_API_KEY

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Gemini APIの設定
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # 画像を保存
    filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filename)
    
    # 画像を解析
    img = Image.open(filename)
    
    # Gemini APIに画像を送信して店舗情報を抽出
    prompt = """
    この画像は、google mapのスクリーンショットや、instagramの投稿画像です。
    画像から以下の情報を抽出してください：
    1. 店舗名
    2. 住所（できるだけ詳細に）
    3. 電話番号（表示されている場合）
    
    JSONフォーマットで回答してください：
    {
        "store_name": "店舗名",
        "address": "住所",
        "phone": "電話番号",
    }

    注意:
    1. instagramの投稿画像の場合は、アカウント名が表示されているので、それを店舗名として誤認しないように注意してください。
    2. 抽出ができなかった場合は、以下のJSONを返してください。
    {
        "error": "抽出できなかった理由",
    }
    """
    
    response = model.generate_content([prompt, img])
    
    # JSONレスポンスを抽出（APIからの応答にJSON文字列が含まれていると仮定）
    try:
        # レスポンスからJSONを抽出
        response_text = response.text
        # JSONの部分だけを抽出する処理（必要に応じて）
        import re
        import json
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            store_info = json.loads(json_str)
        else:
            # JSONが見つからない場合は、テキスト全体を返す
            store_info = {"raw_response": response_text}
    except Exception as e:
        store_info = {"error": str(e), "raw_response": response.text}
    
    return jsonify({
        'filename': file.filename,
        'filepath': filename,
        'store_info': store_info
    })

if __name__ == '__main__':
    app.run(debug=True)