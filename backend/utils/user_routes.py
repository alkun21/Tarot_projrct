# backend/utils/user_routes.py
from flask import Blueprint, request, jsonify
import re
from typing import Dict, Any, Tuple, List
from utils.db import execute_query, execute_query_single, execute_insert
from utils.auth import hash_password, check_password, generate_token, token_required, get_user_info, update_last_login

user_blueprint = Blueprint('user', __name__)
tarot_blueprint = Blueprint('tarot', __name__)

@user_blueprint.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()

    for field in ['name', 'email', 'password', 'confirm_password']:
        if field not in data or not data[field]:
            return jsonify({
                'success': False,
                'message': f'Поле {field} обязательно для заполнения'
            }), 400
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['email']):
        return jsonify({
            'success': False,
            'message': 'Неверный формат email'
        }), 400
    
    if data['password'] != data['confirm_password']:
        return jsonify({
            'success': False,
            'message': 'Пароли не совпадают'
        }), 400
    
    password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$'
    if not re.match(password_pattern, data['password']):
        return jsonify({
            'success': False,
            'message': 'Пароль должен содержать минимум 8 символов, включая заглавные, строчные буквы и цифры'
        }), 400
    
    existing_user = execute_query_single(
        "SELECT id FROM users WHERE email = %(email)s",
        {"email": data['email']}
    )
    
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'Пользователь с таким email уже существует'
        }), 400
    
    hashed_password = hash_password(data['password'])
    
    try:
        user_id = execute_insert(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%(name)s, %(email)s, %(password_hash)s)
            """,
            {
                "name": data['name'],
                "email": data['email'],
                "password_hash": hashed_password
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Регистрация успешно завершена'
        })
    except Exception as e:
        print(f"Error creating user: {e}")
        return jsonify({
            'success': False,
            'message': 'Ошибка при создании пользователя'
        }), 500

@user_blueprint.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user and return a token"""
    data = request.get_json()
    
    for field in ['email', 'password']:
        if field not in data or not data[field]:
            return jsonify({
                'success': False,
                'message': f'Поле {field} обязательно для заполнения'
            }), 400
    
    user = execute_query_single(
        "SELECT id, name, email, password_hash FROM users WHERE email = %(email)s",
        {"email": data['email']}
    )
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'Неверный email или пароль'
        }), 401
    
    if not check_password(data['password'], user['password_hash']):
        return jsonify({
            'success': False,
            'message': 'Неверный email или пароль'
        }), 401
    
    update_last_login(user['id'])
    token = generate_token(user['id'])
    
    user_info = get_user_info(user['id'])
    stats = user_info.get('stats', {})  
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user_info['id'],
            'name': user_info['name'],
            'email': user_info['email'],
            'avatar': user_info['avatar'],
            'stats': stats 
        }
    })
@user_blueprint.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(user):
    """Get user profile information"""
    return jsonify({
        'success': True,
        'user': user
    })

@user_blueprint.route('/api/user/readings', methods=['GET'])
@token_required
def get_user_readings(user):
    """Get user tarot readings history"""
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    readings = execute_query(
        """
        SELECT id, reading_name, description, created_at, reading_data
        FROM tarot_readings
        WHERE user_id = %(user_id)s
        ORDER BY created_at DESC
        LIMIT %(limit)s OFFSET %(offset)s
        """,
        {
            "user_id": user['id'],
            "limit": limit,
            "offset": offset
        }
    )
    
    formatted_readings = []
    for reading in readings:
        description = reading['description']
        if not description and 'reading_data' in reading and 'questions' in reading['reading_data']:
            questions = reading['reading_data']['questions']
            if questions and len(questions) > 0:
                description = questions[0][:100]
        
    
        icon = 'star' 
        if 'расклад на будущее' in reading['reading_name'].lower():
            icon = 'star'
        elif 'карта дня' in reading['reading_name'].lower():
            icon = 'sun'
        elif 'отношения' in reading['reading_name'].lower():
            icon = 'heart'
        
        created_at = reading['created_at']
        date_str = created_at.strftime('%d %B %Y')
        time_str = created_at.strftime('%H:%M')
        
        formatted_readings.append({
            'id': reading['id'],
            'name': reading['reading_name'],
            'description': description,
            'date': date_str,
            'time': time_str,
            'icon': icon,
            'reading_data': reading['reading_data']
        })
    
    return jsonify({
        'success': True,
        'readings': formatted_readings,
        'total': execute_query_single(
            "SELECT COUNT(*) AS count FROM tarot_readings WHERE user_id = %(user_id)s",
            {"user_id": user['id']}
        )['count']
    })

@user_blueprint.route('/api/user/saved-layouts', methods=['GET'])
@token_required
def get_saved_layouts(user):
    """Get user saved card layouts"""
    layouts = execute_query(
        """
        SELECT id, name, description, created_at, cards
        FROM saved_layouts
        WHERE user_id = %(user_id)s
        ORDER BY created_at DESC
        """,
        {"user_id": user['id']}
    )
    formatted_layouts = []
    for layout in layouts:
        created_at = layout['created_at']
        date_str = created_at.strftime('%d %B %Y')
        
        formatted_layouts.append({
            'id': layout['id'],
            'name': layout['name'],
            'description': layout['description'],
            'savedDate': date_str,
            'cards': layout['cards']
        })
    
    return jsonify({
        'success': True,
        'layouts': formatted_layouts
    })

@user_blueprint.route('/api/user/save-layout', methods=['POST'])
@token_required
def save_layout(user):
    """Save a card layout"""
    data = request.get_json()
    
    if 'name' not in data or not data['name']:
        return jsonify({
            'success': False,
            'message': 'Название расклада обязательно'
        }), 400
    
    if 'cards' not in data or not data['cards']:
        return jsonify({
            'success': False,
            'message': 'Карты для расклада обязательны'
        }), 400
    
    try:
        layout_id = execute_insert(
            """
            INSERT INTO saved_layouts (user_id, name, description, cards)
            VALUES (%(user_id)s, %(name)s, %(description)s, %(cards)s)
            """,
            {
                "user_id": user['id'],
                "name": data['name'],
                "description": data.get('description', ''),
                "cards": data['cards']
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Расклад успешно сохранен',
            'layout_id': layout_id
        })
    except Exception as e:
        print(f"Error saving layout: {e}")
        return jsonify({
            'success': False,
            'message': 'Ошибка при сохранении расклада'
        }), 500

@user_blueprint.route('/api/user/delete-layout/<int:layout_id>', methods=['DELETE'])
@token_required
def delete_layout(user, layout_id):
    """Delete a saved layout"""
    try:
        result = execute_query_single(
            """
            DELETE FROM saved_layouts
            WHERE id = %(layout_id)s AND user_id = %(user_id)s
            RETURNING id
            """,
            {
                "layout_id": layout_id,
                "user_id": user['id']
            }
        )
        
        if result:
            return jsonify({
                'success': True,
                'message': 'Расклад успешно удален'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Расклад не найден или у вас нет прав на его удаление'
            }), 404
    except Exception as e:
        print(f"Error deleting layout: {e}")
        return jsonify({
            'success': False,
            'message': 'Ошибка при удалении расклада'
        }), 500


@tarot_blueprint.route('/api/save-reading', methods=['POST'])
@token_required  
def save_reading(user):
    """Save a tarot reading to the user's history"""
    data = request.get_json()
    

    for field in ['session_id', 'reading_name', 'reading_data']:
        if field not in data or not data[field]:
            return jsonify({
                'success': False,
                'message': f'Поле {field} обязательно для заполнения'
            }), 400
    
    try:

        reading_id = execute_insert(
            """
            INSERT INTO tarot_readings (user_id, reading_name, description, reading_data, is_saved)
            VALUES (%(user_id)s, %(reading_name)s, %(description)s, %(reading_data)s, TRUE)
            RETURNING id
            """,
            {
                "user_id": user['id'],
                "reading_name": data['reading_name'],
                "description": data.get('description', ''),
                "reading_data": data['reading_data']
            }
        )
        

        total_readings = execute_query_single(
            """
            SELECT COUNT(*) as count FROM tarot_readings 
            WHERE user_id = %(user_id)s
            """,
            {"user_id": user['id']}
        )['count']

        month_readings = execute_query_single(
            """
            SELECT COUNT(*) as count FROM tarot_readings 
            WHERE user_id = %(user_id)s 
            AND created_at >= date_trunc('month', CURRENT_DATE)
            """,
            {"user_id": user['id']}
        )['count']
        
        return jsonify({
            'success': True,
            'message': 'Чтение успешно сохранено',
            'reading_id': reading_id,
            'stats': {
                'totalReadings': total_readings,
                'monthReadings': month_readings
            }
        })
    except Exception as e:
        print(f"Error saving reading: {e}")
        return jsonify({
            'success': False,
            'message': 'Ошибка при сохранении чтения'
        }), 500