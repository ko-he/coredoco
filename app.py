import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import io
from config import GEMINI_API_KEY, PORT

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Gemini APIの設定
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/')
def index():
    return '{"status": "ok"}'

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
    この画像はカフェや飲食店が記載された、google mapのスクリーンショットや、instagramの投稿画像です。
    画像から以下の情報を抽出してください：
    1. 店舗名
    2. 住所（できるだけ詳細に）
    3. 電話番号（表示されている場合）
    
    JSONフォーマットで回答してください：
    [
        {
            "store_name": "店舗名",
            "address": "住所",
            "phone": "電話番号",
        }
    ]

    注意:
    1. instagramの投稿画像の場合は、アカウント名が表示されているので、それを店舗名として誤認しないように注意してください。
    2. 情報が複数抽出できる場合は、それらを配列に複数のオブジェクトを格納して返してください。
    3. 抽出ができなかった場合は、以下のJSONを返してください。
    {
        "error": "抽出できなかった理由",
    }
    """
    
    response = model.generate_content([prompt, img])
    
    # JSONレスポンスを抽出（APIからの応答にJSON文字列が含まれていると仮定）
    try:
        # レスポンスからJSONを抽出
        response_text = response.text
        # JSONの部分だけを抽出する処理
        import re
        import json
        
        # 配列形式のJSONを抽出
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            store_info = json.loads(json_str)
        else:
            # 単一オブジェクトのJSONを抽出（エラーケース用）
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                error_info = json.loads(json_str)
                store_info = [error_info]  # エラー情報を配列に変換
            else:
                # JSONが見つからない場合は、テキスト全体をエラーとして配列に格納
                store_info = [{"error": "JSONの解析に失敗しました", "raw_response": response_text}]
    except Exception as e:
        store_info = [{"error": str(e), "raw_response": response.text}]
    
    return jsonify({
        'filename': file.filename,
        'filepath': filename,
        'store_info': store_info  # 常に配列形式で返す
    })

@app.route('/generate-map-url', methods=['POST'])
def generate_map_url():
    data = request.get_json()
    if not data or 'store_info' not in data:
        return jsonify({'error': 'No store information provided'}), 400
    
    store_info = data['store_info']
    if 'error' in store_info:
        return jsonify({'error': store_info['error']}), 400
    
    # Gemini APIに店舗情報を送信してGoogle Maps URLを生成
    prompt = f"""
    以下の店舗情報から、Google Mapsの検索URLを生成してください。
    店舗名: {store_info.get('store_name', '')}
    住所: {store_info.get('address', '')}
    
    以下の形式でJSONを返してください：
    {{
        "map_url": "https://www.google.com/maps/search/?api=1&query=エンコードされた検索クエリ"
    }}
    
    注意:
    1. 検索クエリは「店舗名 住所」の形式で、URLエンコードしてください
    2. 店舗名や住所が不明な場合は、利用可能な情報のみを使用してください
    3. 情報が不足している場合は、以下のJSONを返してください
    {{
        "error": "情報が不足しているためURLを生成できません"
    }}
    """
    
    response = model.generate_content(prompt)
    
    try:
        # レスポンスからJSONを抽出
        response_text = response.text
        import re
        import json
        
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            map_info = json.loads(json_str)
        else:
            map_info = {"error": "URLの生成に失敗しました", "raw_response": response_text}
    except Exception as e:
        map_info = {"error": str(e), "raw_response": response.text}
    
    return jsonify(map_info)

if __name__ == '__main__':
    app.run(debug=True, port=PORT)