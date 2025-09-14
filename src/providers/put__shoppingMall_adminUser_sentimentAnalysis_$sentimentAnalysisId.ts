import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing sentiment analysis record.
 *
 * This function allows an admin user to update an existing sentiment analysis
 * record identified by its UUID. It performs a partial update with fields
 * provided in the body. The function throws an error if the record does not
 * exist.
 *
 * All date fields are handled as strings with ISO 8601 format as per branding
 * conventions.
 *
 * @param props - Properties including authenticated adminUser, the ID of the
 *   sentiment analysis record to update, and partial update data.
 * @param props.adminUser - The authenticated admin user performing the update.
 * @param props.sentimentAnalysisId - The UUID of the sentiment analysis record.
 * @param props.body - Partial update data for the sentiment analysis record.
 * @returns The updated sentiment analysis record, fully populated.
 * @throws {Error} When the sentiment analysis record does not exist.
 */
export async function put__shoppingMall_adminUser_sentimentAnalysis_$sentimentAnalysisId(props: {
  adminUser: AdminuserPayload;
  sentimentAnalysisId: string & tags.Format<"uuid">;
  body: IShoppingMallSentimentAnalysis.IUpdate;
}): Promise<IShoppingMallSentimentAnalysis> {
  const { adminUser, sentimentAnalysisId, body } = props;

  const existing =
    await MyGlobal.prisma.shopping_mall_sentiment_analysis.findUnique({
      where: { id: sentimentAnalysisId },
    });

  if (!existing) throw new Error("Sentiment analysis record not found");

  const updated = await MyGlobal.prisma.shopping_mall_sentiment_analysis.update(
    {
      where: { id: sentimentAnalysisId },
      data: {
        product_id: body.product_id ?? undefined,
        user_id: body.user_id ?? undefined,
        sentiment_score: body.sentiment_score ?? undefined,
        sentiment_category: body.sentiment_category ?? undefined,
        source_text: body.source_text ?? undefined,
        analysis_date: body.analysis_date ?? undefined,
        deleted_at: body.deleted_at ?? undefined,
        updated_at: toISOStringSafe(new Date()),
      },
    },
  );

  return {
    id: updated.id as string & tags.Format<"uuid">,
    product_id: updated.product_id as string & tags.Format<"uuid">,
    user_id: updated.user_id ?? null,
    sentiment_score: updated.sentiment_score,
    sentiment_category: updated.sentiment_category,
    source_text: updated.source_text,
    analysis_date: toISOStringSafe(updated.analysis_date),
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
