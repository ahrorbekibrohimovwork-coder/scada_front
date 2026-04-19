from flask import Flask, jsonify, request  # Добавили request сюда
import json  # Добавили для печати логов

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "online", "message": "Docker on Windows is working!"})

@app.route('/debug', methods=['POST', 'GET'])
def debug():
    # Теперь request берется из flask и будет работать
    debug_info = {
        "method": request.method,
        "headers": dict(request.headers),
        "args": request.args.to_dict(),
        "json": request.get_json(silent=True),
        "data": request.data.decode('utf-8', errors='ignore')
    }
    
    print("\n--- ВХОДЯЩИЙ ЗАПРОС ---")
    # Теперь json.dumps сработает, так как мы импортировали json
    print(json.dumps(debug_info, indent=4, ensure_ascii=False))
    print("----------------------\n")
    
    return jsonify({
        "status": "received",
        "received_data": debug_info
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)