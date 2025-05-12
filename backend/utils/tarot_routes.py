from flask import Blueprint, request, jsonify
from utils.db import execute_query, execute_query_single, execute_insert
from utils.auth import token_required
import json  
tarot_blueprint = Blueprint('tarot', __name__)

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
        serialized_reading_data = json.dumps(data['reading_data'])
        params = {
            "user_id": user['id'],
            "reading_name": data['reading_name'],
            "description": data.get('description', ''),
            "reading_data": serialized_reading_data 
        }
        
        execute_query(
            """
            INSERT INTO tarot_readings (user_id, reading_name, description, reading_data, is_saved)
            VALUES (%(user_id)s, %(reading_name)s, %(description)s, %(reading_data)s, TRUE)
            """,
            params
        )
        
        try:
            total_readings_query = """
                SELECT COUNT(*) as count FROM tarot_readings 
                WHERE user_id = %(user_id)s
            """
            total_readings_result = execute_query(total_readings_query, {"user_id": user['id']})
            total_readings = total_readings_result[0]['count'] if total_readings_result else 0
        except Exception as stats_error:
            print(f"Error getting total readings: {stats_error}")
            total_readings = 0
        try:
            month_readings_query = """
                SELECT COUNT(*) as count FROM tarot_readings 
                WHERE user_id = %(user_id)s 
                AND created_at >= date_trunc('month', CURRENT_DATE)
            """
            month_readings_result = execute_query(month_readings_query, {"user_id": user['id']})
            month_readings = month_readings_result[0]['count'] if month_readings_result else 0
        except Exception as stats_error:
            print(f"Error getting month readings: {stats_error}")
            month_readings = 0
        
        return jsonify({
            'success': True,
            'message': 'Чтение успешно сохранено',
            'stats': {
                'totalReadings': total_readings,
                'monthReadings': month_readings
            }
        })
    except Exception as e:
        print(f"Error saving reading: {e}")
        return jsonify({
            'success': False,
            'message': f'Ошибка при сохранении чтения: {str(e)}'
        }), 500

@tarot_blueprint.route('/api/user/readings/<int:reading_id>', methods=['GET'])
@token_required
def get_reading(user, reading_id):
    """Get a specific tarot reading by ID"""
    try:
        reading_query = """
            SELECT id, reading_name, description, reading_data, 
                   created_at, is_saved
            FROM tarot_readings 
            WHERE id = %(reading_id)s AND user_id = %(user_id)s
        """
        readings = execute_query(
            reading_query,
            {
                "user_id": user['id'],
                "reading_id": reading_id
            }
        )
        
        if not readings or len(readings) == 0:
            return jsonify({
                'success': False,
                'message': 'Чтение не найдено или у вас нет прав доступа к нему'
            }), 404
            
        reading = readings[0]
            
        if reading['reading_data']:
            try:
                reading['reading_data'] = json.loads(reading['reading_data'])
            except json.JSONDecodeError:
                pass
            
        created_at = reading['created_at']
        reading['date'] = created_at.strftime('%d.%m.%Y')
        reading['time'] = created_at.strftime('%H:%M')
            
        return jsonify({
            'success': True,
            'reading': reading
        })
    except Exception as e:
        print(f"Error getting reading: {e}")
        return jsonify({
            'success': False,
            'message': f'Ошибка при получении чтения: {str(e)}'
        }), 500