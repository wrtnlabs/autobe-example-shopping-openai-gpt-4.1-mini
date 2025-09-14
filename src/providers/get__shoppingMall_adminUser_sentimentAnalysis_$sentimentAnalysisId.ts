import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a specific customer sentiment analysis record by its ID.
 *
 * This function fetches detailed sentiment data including score, category,
 * source text, analysis date, and references to the user and product. It only
 * returns active (non-deleted) records.
 *
 * Authorization must be performed prior to calling this function.
 *
 * @param props - The function input parameters
 * @param props.adminUser - The authenticated admin user performing the
 *   operation
 * @param props.sentimentAnalysisId - The UUID of the sentiment analysis record
 *   to retrieve
 * @returns The detailed sentiment analysis record matching the provided ID
 * @throws {Error} Throws if the record does not exist or is deleted
 */
export async function get__shoppingMall_adminUser_sentimentAnalysis_$sentimentAnalysisId(props: {
  adminUser: AdminuserPayload;
  sentimentAnalysisId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSentimentAnalysis> {
  const { adminUser, sentimentAnalysisId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_sentiment_analysis.findUniqueOrThrow({
      where: { id: sentimentAnalysisId, deleted_at: null },
    });

  return {
    id: record.id,
    product_id: record.product_id,
    user_id: record.user_id ?? null,
    sentiment_score: record.sentiment_score,
    sentiment_category: record.sentiment_category,
    source_text: record.source_text,
    analysis_date: toISOStringSafe(record.analysis_date),
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
