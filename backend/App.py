from flask import Flask, request, jsonify, send_from_directory
import json
import os
import random
from pathlib import Path
import uuid
from dotenv import load_dotenv
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from flask_cors import CORS

from utils.db import execute_query, execute_query_single, execute_insert
from utils.user_routes import user_blueprint
from utils.tarot_routes import tarot_blueprint
from utils.auth import token_required, get_user_info

from utils.card_recognition import TAROT_CARDS_DATA
from utils.prompts import TAROT_SYSTEM_PROMPT

app = Flask(__name__) 
CORS(app)
load_dotenv()

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

app.register_blueprint(user_blueprint)
app.register_blueprint(tarot_blueprint) 

SESSION_DIR = os.environ.get("SESSION_DIR", "./data/sessions")
os.makedirs(SESSION_DIR, exist_ok=True)

CARDS_IMAGES_DIR = os.environ.get("CARDS_IMAGES_DIR", "./static/images/tarot")
os.makedirs(CARDS_IMAGES_DIR, exist_ok=True)

def init_db():
    """Initialize the database tables if they don't exist"""
    try:
        from utils.db import get_db_connection
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'users'
                    );
                """)
                if not cur.fetchone()['exists']:
                    schema_file = Path("./db_schema.sql")
                    if schema_file.exists():
                        with open(schema_file, "r") as f:
                            schema_sql = f.read()
                            cur.execute(schema_sql)
                            conn.commit()
                            print("Database tables created successfully!")
                    else:
                        print("Schema file not found! Database tables were not created.")
    except Exception as e:
        print(f"Error initializing database: {e}")


init_db()
def validate_tarot_cards():
    cards_dir = Path(os.environ.get("CARDS_IMAGES_DIR", "./static/images/tarot"))
    missing_images = []
    for card in TAROT_CARDS_DATA:
        image_path = cards_dir / card["image"]
        if not image_path.exists():
            missing_images.append(card["name"])
    if missing_images:
        print(f"ВНИМАНИЕ: Не найдены изображения для следующих карт: {', '.join(missing_images)}")
        print(f"Проверьте директорию {cards_dir}")
    else:
        print("Все изображения карт найдены!")

def get_card_by_name(name: str) -> Optional[Dict[str, Any]]:
    return next((card for card in TAROT_CARDS_DATA if card["name"] == name), None)

class TarotSession:
    def __init__(self, session_id: str, user_id: Optional[int] = None):
        self.session_id = session_id
        self.user_id = user_id
        self.questions_asked = False
        self.cards_drawn = False
        self.user_responses = []
        self.cards = []
        self.history = []
        self.save()
    
    def save(self):
        session_path = Path(SESSION_DIR) / f"{self.session_id}.json"
        session_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "questions_asked": self.questions_asked,
            "cards_drawn": self.cards_drawn,
            "user_responses": self.user_responses,
            "cards": self.cards,
            "history": self.history
        }
        with open(session_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    @classmethod
    def load(cls, session_id: str):
        session_path = Path(SESSION_DIR) / f"{session_id}.json"
        if not session_path.exists():
            return cls(session_id)
        with open(session_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        session = cls(session_id)
        session.user_id = data.get("user_id")
        session.questions_asked = data.get("questions_asked", False)
        session.cards_drawn = data.get("cards_drawn", False)
        session.user_responses = data.get("user_responses", [])
        session.cards = data.get("cards", [])
        session.history = data.get("history", [])
        return session
    
    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})
        self.save()
    
    def add_user_response(self, response: str):
        self.user_responses.append(response)
        self.add_message("user", response)
        self.save()
    
    def draw_cards(self, cards):
        self.cards = cards
        self.cards_drawn = True
        self.save()
    
    def save_to_database(self, reading_name="Расклад Таро", description=None):
        """Save the reading to the database if user is authenticated"""
        if not self.user_id:
            return None
        
        if not description and len(self.user_responses) > 0:
            description = self.user_responses[0][:100]  
        reading_data = {
            "cards": self.cards,
            "questions": self.user_responses,
            "history": self.history
        }
        reading_id = execute_insert(
            """
            INSERT INTO tarot_readings
            (user_id, reading_name, description, reading_data, is_saved)
            VALUES
            (%(user_id)s, %(name)s, %(description)s, %(reading_data)s, TRUE)
            """,
            {
                "user_id": self.user_id,
                "name": reading_name,
                "description": description or "Расклад Таро",
                "reading_data": json.dumps(reading_data)
            }
        )
        
        return reading_id

def get_ai_response(session: TarotSession) -> str:
    """Get AI response based on user questions and cards"""
    messages = [{"role": "system", "content": TAROT_SYSTEM_PROMPT}]
    messages.extend(session.history)
    
    if session.questions_asked and session.cards_drawn:
        cards_info = []
        for card in session.cards:
            card_description = f"Карта: {card['name']}, тип: {card['type']}"
            cards_info.append(card_description)
        
        cards_msg = "Выбранные карты: " + ", ".join([card["name"] for card in session.cards])
        cards_details = "Подробная информация о картах: " + "; ".join(cards_info)
        
        session.add_message("system", cards_msg)
        session.add_message("system", cards_details)
        
        messages.append({"role": "system", "content": cards_msg})
        messages.append({"role": "system", "content": cards_details})
    
    response = model.generate_content([m["content"] for m in messages])
    session.add_message("assistant", response.text)
    return response.text

@app.route('/api/tarot-cards', methods=['GET'])
def get_tarot_cards():
    """Get all tarot cards"""
    return jsonify(TAROT_CARDS_DATA)

@app.route('/api/random-subset-cards', methods=['GET'])
def get_random_subset_cards():
    """Get a random subset of tarot cards"""
    cards_count = request.args.get('count', 20, type=int)
    selected_cards = random.sample(TAROT_CARDS_DATA, min(cards_count, len(TAROT_CARDS_DATA)))    
    return jsonify({
        "cards": selected_cards,
        "total_count": len(selected_cards)
    })

@app.route('/api/submit-questions', methods=['POST'])
def submit_questions():
    """Submit questions for a tarot reading"""
    data = request.json
    session_id = data.get('session_id')
    responses = data.get('responses')
    
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        from utils.auth import verify_token
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload:
            user_id = payload["user_id"]
    
    session = TarotSession.load(session_id)
    
    if user_id:
        session.user_id = user_id
    
    for response in responses:
        session.add_user_response(response)
    
    session.questions_asked = True
    session.save()
    
    return jsonify({
        "success": True
    })

@app.route('/api/draw-cards', methods=['POST'])
def draw_tarot_cards():
    """Draw tarot cards for a reading"""
    data = request.json
    session_id = data.get('session_id')
    cards = data.get('cards')
    reading_detail = data.get('reading_detail', 'detailed')
    save_to_account = data.get('save_to_account', False)
    reading_name = data.get('reading_name', 'Расклад Таро')
    
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        from utils.auth import verify_token
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload:
            user_id = payload["user_id"]
    
    session = TarotSession.load(session_id)
    
    if user_id:
        session.user_id = user_id
    
    selected_cards = []
    for card_name in cards:
        card_info = next((card for card in TAROT_CARDS_DATA if card["name"] == card_name), None)
        if card_info:
            selected_cards.append(card_info)
    
    session.draw_cards(selected_cards)
    session.add_user_response(f"Я выбрал карты: {', '.join(cards)}")
    
    session.add_message("system", f"Пользователь предпочитает {reading_detail} чтение карт")
    
    try:
        ai_message = get_ai_response(session)
        
        reading_id = None
        if save_to_account and session.user_id:
            reading_id = session.save_to_database(reading_name=reading_name)
        
        return jsonify({
            "success": True,
            "message": ai_message,
            "reading_id": reading_id
        })
    except Exception as e:
        print(f"Ошибка при получении интерпретации: {e}")
        return jsonify({
            "success": False,
            "message": "Произошла ошибка при получении интерпретации. Пожалуйста, попробуйте снова.",
            "error": str(e)
        }), 500

@app.route('/api/new-session', methods=['POST'])
def new_session():
    """Create a new tarot reading session"""
    session_id = str(uuid.uuid4())
    
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        from utils.auth import verify_token
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload:
            user_id = payload["user_id"]
    
    session = TarotSession(session_id, user_id)
    initial_message = get_ai_response(session)
    
    return jsonify({
        "session_id": session_id,
        "message": initial_message,
        "is_authenticated": user_id is not None
    })

@app.route('/api/message', methods=['POST', 'GET'])
def handle_message():
    """Handle chat messages in a tarot session"""
    if request.method == 'POST':
        data = request.json
        session_id = data.get('session_id')
        user_message = data.get('message')
        session = TarotSession.load(session_id)
        session.add_user_response(user_message)
        ai_message = get_ai_response(session)
        return jsonify({
            "message": ai_message
        })
    elif request.method == 'GET':
        session_id = request.args.get('session_id')
        session = TarotSession.load(session_id)
        ai_message = get_ai_response(session)
        return jsonify({
            "message": ai_message
        })

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get the chat history for a session"""
    session_id = request.args.get('session_id')
    session = TarotSession.load(session_id)
    return jsonify({
        "history": session.history
    })

@app.route('/api/cards', methods=['GET'])
def get_cards():
    """Get all tarot cards with minimal information"""
    cards_data = []
    for card in TAROT_CARDS_DATA:
        cards_data.append({
            "name": card["name"],
            "image": card["image"]
        })
    return jsonify({
        "cards": cards_data 
    })

@app.route('/api/save-reading', methods=['POST'])
@token_required
def save_reading_to_account(user):
    """Save a reading to user's account"""
    data = request.json
    session_id = data.get('session_id')
    reading_name = data.get('reading_name', 'Расклад Таро')
    description = data.get('description')
    
    session = TarotSession.load(session_id)
    session.user_id = user["id"]
    
    reading_id = session.save_to_database(reading_name=reading_name, description=description)
    
    if reading_id:
        return jsonify({
            "success": True,
            "message": "Расклад успешно сохранен",
            "reading_id": reading_id
        })
    else:
        return jsonify({
            "success": False,
            "message": "Не удалось сохранить расклад"
        }), 400

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """Check if the user is authenticated"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        from utils.auth import verify_token
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if payload:
            user = get_user_info(payload["user_id"])
            if user:
                return jsonify({
                    "authenticated": True,
                    "user": {
                        "id": user["id"],
                        "name": user["name"],
                        "email": user["email"]
                    }
                })
    
    return jsonify({
        "authenticated": False
    })

@app.route('/static/images/tarot/<path:filename>')
def tarot_image(filename):
    return send_from_directory(CARDS_IMAGES_DIR, filename)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/static/media/<path:filename>')
def serve_static_media(filename):
    media_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', 'static', 'media'))
    return send_from_directory(media_dir, filename)

@app.route('/static/js/<path:filename>')
def serve_static_js(filename):
    static_js_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', 'static', 'js'))
    return send_from_directory(static_js_dir, filename)

@app.route('/static/css/<path:filename>')
def serve_static_css(filename):
    static_css_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build', 'static', 'css'))
    return send_from_directory(static_css_dir, filename)

@app.route('/manifest.json')
def serve_manifest():
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'), 'manifest.json')

@app.route('/favicon.ico')
def serve_favicon():
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'), 'favicon.ico')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path.startswith('api/'):
        return {"error": "Not found"}, 404
    react_build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build'))
    if path == '':
        return send_from_directory(react_build_dir, 'index.html')
    file_path = os.path.join(react_build_dir, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        directory, filename = os.path.split(file_path)
        return send_from_directory(directory, filename)
    return send_from_directory(react_build_dir, 'index.html')

validate_tarot_cards()

if __name__ == '__main__':
    app.run(debug=True, port=5000)