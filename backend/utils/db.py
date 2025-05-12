import os
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row  
from typing import Dict, Any, Optional, List, Union

load_dotenv()

DB_HOST = os.environ["DB_HOST"]
DB_PORT = os.environ["DB_PORT"]
DB_NAME = os.environ["DB_NAME"]
DB_USER = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]

def get_db_connection():
    """Create and return a new database connection"""
    conn = psycopg.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        row_factory=dict_row 
    )
    conn.autocommit = True
    return conn


def execute_query(query, params=None):
    """Execute a query and return all results"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        if cur.description:
            return cur.fetchall()
        return []
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def execute_query_single(query, params=None):
    """Execute a query and return the first row of results"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        if cur.description:
            result = cur.fetchone()
            if result:
                return result
            raise Exception("The last operation didn't produce a result")
        return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def execute_insert(query, params=None):
    """Execute an insert query and return the inserted ID"""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(query, params)
        id_result = cur.fetchone()
        if id_result and 'id' in id_result:
            return id_result['id']
        return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def execute_update(query: str, params: Dict[str, Any]) -> int:
    """Execute an update query and return the number of affected rows"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            conn.commit()
            return cur.rowcount
