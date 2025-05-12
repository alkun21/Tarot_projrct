import os
from functools import wraps
from flask import request, jsonify
import jwt
import datetime
import bcrypt
from dotenv import load_dotenv
from typing import Dict, Any, Optional, Callable
from utils.db import execute_query_single, execute_update

load_dotenv()

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "mystic_tarot_secret_key")
JWT_EXPIRATION_HOURS = int(os.environ.get("JWT_EXPIRATION_HOURS", 24))

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def check_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_token(user_id: int) -> str:
    """Generate a JWT token for a user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a JWT token and return the payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f: Callable) -> Callable:
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Authorization token is missing'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        user = get_user_info(payload['user_id'])
        if not user:
            return jsonify({'message': 'User not found'}), 401
        
        return f(user, *args, **kwargs)
    
    return decorated

def get_user_info(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user information from the database with aggregated stats"""
    query = """
        SELECT u.id, u.name, u.email, u.created_at,
               COUNT(tr.id) as total_readings,
               COUNT(CASE WHEN tr.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as month_readings,
               COUNT(sl.id) as saved_layouts
        FROM users u
        LEFT JOIN tarot_readings tr ON u.id = tr.user_id
        LEFT JOIN saved_layouts sl ON u.id = sl.user_id
        WHERE u.id = %(user_id)s
        GROUP BY u.id
    """
    user = execute_query_single(query, {"user_id": user_id})
    
    if not user:
        return None
    
    user["avatar"] = user["name"][0].upper() if user["name"] else "U"
    
    return user

def update_last_login(user_id: int) -> None:
    """Update the last login timestamp for a user"""
    execute_update(
        "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %(user_id)s",
        {"user_id": user_id}
    )