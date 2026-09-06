/**
 * Neon Serverless PostgreSQL Database Gateway for Next.js
 * Implements connection pooling, Row-Level Security (RLS) tenant isolation,
 * and transactional execution of PL/pgSQL Stored Procedures.
 */

import { Pool, PoolClient } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err);
    });
  }
  return pool;
}

export interface TenantContext {
  agencyId?: string;
  userId?: string;
}

/**
 * Executes a callback within a managed database client transaction,
 * setting the session-level RLS variable `app.current_agency_id`.
 */
export async function withTenantTransaction<T>(
  agencyId: string | undefined,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  if (!p) {
    throw new Error("DATABASE_URL is not configured on this serverless runtime.");
  }

  const client = await p.connect();
  try {
    await client.query("BEGIN;");
    if (agencyId) {
      await client.query("SELECT set_config('app.current_agency_id', $1, true);", [agencyId]);
    }
    const result = await callback(client);
    await client.query("COMMIT;");
    return result;
  } catch (error) {
    await client.query("ROLLBACK;");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Direct invocation of PL/pgSQL Stored Procedure: update_comp_set(p_hotel_id, p_competitor_ids)
 */
export async function callUpdateCompSet(
  hotelId: number,
  competitorIds: number[],
  agencyId?: string
) {
  const p = getPool();
  if (p) {
    return withTenantTransaction(agencyId, async (client) => {
      const res = await client.query("SELECT update_comp_set($1, $2) as result;", [
        hotelId,
        competitorIds,
      ]);
      return res.rows[0]?.result;
    });
  }

  // Graceful fallback for local offline / demo environment
  console.log(`[Mock DB Chef] update_comp_set called for Hotel #${hotelId}:`, competitorIds);
  return {
    status: "success",
    hotel_id: hotelId,
    active_competitors_count: competitorIds.length,
    deactivated_competitors_count: 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Direct invocation of PL/pgSQL Stored Procedure: approve_recommendation(p_rec_id)
 */
export async function callApproveRecommendation(
  recommendationId: number,
  agencyId?: string
) {
  const p = getPool();
  if (p) {
    return withTenantTransaction(agencyId, async (client) => {
      const res = await client.query("SELECT approve_recommendation($1) as result;", [
        recommendationId,
      ]);
      return res.rows[0]?.result;
    });
  }

  // Graceful fallback for local offline / demo environment
  console.log(`[Mock DB Chef] approve_recommendation called for Rec #${recommendationId}`);
  return {
    status: "success",
    recommendation_id: recommendationId,
    hotel_id: 1,
    hotel_name: "The Claridges New Delhi",
    target_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    previous_rate: 7200.0,
    new_rate: 8950.0,
    currency: "INR",
    applied_at: new Date().toISOString(),
    whatsapp_phone: "+919810123456",
    pms_channel_manager: {
      provider: "ezee_centrix",
      api_key: "EZ_LIVE_SEC_882910",
      hotel_code: "CLARIDGES_ND_01",
    },
  };
}
