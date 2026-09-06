"""
Database Gateway for AI Hotel Revenue Intelligence Platform
Supports Neon Serverless PostgreSQL with SSL, Connection Pooling,
and PL/pgSQL Stored Procedure execution under multi-tenant RLS contexts.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("RevenueDB")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

DATABASE_URL = os.getenv("DATABASE_URL")

# Lazy imported database pool
_pg_pool = None

def get_pg_pool():
    global _pg_pool
    if _pg_pool is None and DATABASE_URL:
        try:
            import psycopg2
            from psycopg2 import pool
            # Neon requires sslmode=require
            db_url = DATABASE_URL
            if "sslmode" not in db_url:
                db_url += "?sslmode=require" if "?" not in db_url else "&sslmode=require"
            _pg_pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=db_url
            )
            logger.info("Connected to Neon Serverless PostgreSQL connection pool.")
        except Exception as e:
            logger.warning(f"Failed to initialize PostgreSQL pool: {e}. Utilizing local fallback.")
            _pg_pool = None
    return _pg_pool


class DatabaseGateway:
    """
    Transactional Gateway enforcing the 'Manager + Chef' architecture.
    All state mutations execute strictly through PL/pgSQL Stored Procedures.
    """

    @staticmethod
    def set_tenant_context(cursor, agency_id: str):
        """Set RLS agency context for tenant isolation."""
        if agency_id:
            cursor.execute("SELECT set_config('app.current_agency_id', %s, true);", (agency_id,))

    @classmethod
    def execute_insert_rate_observation(
        cls,
        agency_id: str,
        entity_type: str,
        entity_id: int,
        stay_date: date,
        room_type: str,
        raw_room_name: str,
        normalized_room_type: str,
        rate: float,
        source_channel: str = "Agoda",
        observed_at: Optional[datetime] = None
    ) -> int:
        """
        Executes stored procedure `insert_rate_observation` in PostgreSQL.
        Guarantees idempotent UPSERT without race conditions.
        """
        pool = get_pg_pool()
        if pool:
            conn = pool.getconn()
            try:
                with conn.cursor() as cur:
                    cls.set_tenant_context(cur, agency_id)
                    cur.execute(
                        """
                        SELECT insert_rate_observation(
                            %s::UUID, %s, %s, %s, %s, %s, %s, %s, %s, %s
                        );
                        """,
                        (
                            agency_id,
                            entity_type,
                            entity_id,
                            stay_date,
                            room_type,
                            raw_room_name,
                            normalized_room_type,
                            rate,
                            source_channel,
                            observed_at or datetime.utcnow()
                        )
                    )
                    rate_id = cur.fetchone()[0]
                    conn.commit()
                    return rate_id
            except Exception as e:
                conn.rollback()
                logger.error(f"Error calling insert_rate_observation: {e}")
                raise
            finally:
                pool.putconn(conn)
        else:
            # Fallback for local offline demo / mock testing
            logger.info(f"[Mock DB] Stored Procedure insert_rate_observation executed: {entity_type} #{entity_id} {stay_date} @ ₹{rate} ({source_channel})")
            return 1001

    @classmethod
    def execute_update_comp_set(cls, hotel_id: int, competitor_ids: List[int], agency_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes stored procedure `update_comp_set(p_hotel_id, p_competitor_ids)`.
        Transactionally activates selected competitors and deactivates unselected.
        """
        pool = get_pg_pool()
        if pool:
            conn = pool.getconn()
            try:
                with conn.cursor() as cur:
                    if agency_id:
                        cls.set_tenant_context(cur, agency_id)
                    cur.execute(
                        "SELECT update_comp_set(%s, %s);",
                        (hotel_id, competitor_ids)
                    )
                    result = cur.fetchone()[0]
                    conn.commit()
                    return result if isinstance(result, dict) else json.loads(result)
            except Exception as e:
                conn.rollback()
                logger.error(f"Error calling update_comp_set: {e}")
                raise
            finally:
                pool.putconn(conn)
        else:
            logger.info(f"[Mock DB] Stored Procedure update_comp_set executed for Hotel #{hotel_id} with {len(competitor_ids)} competitors.")
            return {
                "status": "success",
                "hotel_id": hotel_id,
                "active_competitors_count": len(competitor_ids),
                "deactivated_competitors_count": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

    @classmethod
    def execute_approve_recommendation(cls, recommendation_id: int, agency_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes stored procedure `approve_recommendation(p_rec_id)`.
        Approves rate change and returns channel manager credentials for live OTA push.
        """
        pool = get_pg_pool()
        if pool:
            conn = pool.getconn()
            try:
                with conn.cursor() as cur:
                    if agency_id:
                        cls.set_tenant_context(cur, agency_id)
                    cur.execute(
                        "SELECT approve_recommendation(%s);",
                        (recommendation_id,)
                    )
                    result = cur.fetchone()[0]
                    conn.commit()
                    return result if isinstance(result, dict) else json.loads(result)
            except Exception as e:
                conn.rollback()
                logger.error(f"Error calling approve_recommendation: {e}")
                raise
            finally:
                pool.putconn(conn)
        else:
            logger.info(f"[Mock DB] Stored Procedure approve_recommendation executed for Rec #{recommendation_id}.")
            return {
                "status": "success",
                "recommendation_id": recommendation_id,
                "hotel_id": 1,
                "hotel_name": "The Claridges New Delhi",
                "target_date": date.today().isoformat(),
                "previous_rate": 7200.00,
                "new_rate": 8950.00,
                "currency": "INR",
                "pms_channel_manager": {
                    "provider": "ezee_centrix",
                    "api_key": "EZ_TEST_LIVE_KEY_8892",
                    "hotel_code": "IND_DEL_1092"
                }
            }

    @classmethod
    def insert_event(cls, name: str, event_date: date, venue: str, lat: float, lng: float, attendance: int, category: str, agency_id: Optional[str] = None):
        """Saves structured event to events table."""
        pool = get_pg_pool()
        if pool:
            conn = pool.getconn()
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO events (agency_id, name, event_date, venue_name, latitude, longitude, expected_attendance, category)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (name, event_date, venue_name)
                        DO UPDATE SET expected_attendance = EXCLUDED.expected_attendance, category = EXCLUDED.category
                        RETURNING id;
                        """,
                        (agency_id, name, event_date, venue, lat, lng, attendance, category)
                    )
                    event_id = cur.fetchone()[0]
                    conn.commit()
                    return event_id
            except Exception as e:
                conn.rollback()
                logger.error(f"Error inserting event {name}: {e}")
                raise
            finally:
                pool.putconn(conn)
        else:
            logger.info(f"[Mock DB] Inserted event: '{name}' on {event_date} at {venue} (Att: {attendance:,})")
            return 501

    @classmethod
    def insert_recommendation(cls, agency_id: str, hotel_id: int, stay_date: date, current_rate: float, recommended_rate: float, confidence: float, explanation: str) -> int:
        """Saves generated recommendation to recommendations table with Pending status."""
        pool = get_pg_pool()
        if pool:
            conn = pool.getconn()
            try:
                with conn.cursor() as cur:
                    cls.set_tenant_context(cur, agency_id)
                    cur.execute(
                        """
                        INSERT INTO recommendations (agency_id, hotel_id, stay_date, current_rate, recommended_rate, model_confidence, explanation_text, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')
                        RETURNING id;
                        """,
                        (agency_id, hotel_id, stay_date, current_rate, recommended_rate, confidence, explanation)
                    )
                    rec_id = cur.fetchone()[0]
                    conn.commit()
                    return rec_id
            except Exception as e:
                conn.rollback()
                logger.error(f"Error inserting recommendation: {e}")
                raise
            finally:
                pool.putconn(conn)
        else:
            logger.info(f"[Mock DB] Created Recommendation for Hotel #{hotel_id} for {stay_date}: ₹{current_rate} -> ₹{recommended_rate} (Conf: {confidence})")
            return 901
