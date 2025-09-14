import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new customer sentiment analysis record.
 *
 * This endpoint allows authorized admin users to add fresh AI-generated
 * customer sentiment data. Incoming data is stored with references to product
 * and optionally user. Timestamps are set automatically, and soft deletion flag
 * is null on creation.
 *
 * @param props - Object containing:
 *
 *   - AdminUser: The authenticated admin user payload.
 *   - Body: The sentiment analysis record data to create.
 *
 * @returns The newly created sentiment analysis record, including timestamps.
 * @throws {Error} If any required field is missing or Prisma fails.
 */
export async function post__shoppingMall_adminUser_sentimentAnalysis(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSentimentAnalysis.ICreate;
}): Promise<IShoppingMallSentimentAnalysis> {
  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_sentiment_analysis.create(
    {
      data: {
        id: id,
        product_id: props.body.product_id,
        user_id: props.body.user_id ?? null,
        sentiment_score: props.body.sentiment_score,
        sentiment_category: props.body.sentiment_category,
        source_text: props.body.source_text,
        analysis_date: props.body.analysis_date,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    },
  );

  return {
    id: created.id,
    product_id: created.product_id,
    user_id: created.user_id ?? null,
    sentiment_score: created.sentiment_score,
    sentiment_category: created.sentiment_category,
    source_text: created.source_text,
    analysis_date: toISOStringSafe(created.analysis_date),
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
