import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a specific sentiment analysis record from the shopping mall system.
 *
 * This endpoint permanently removes the sentiment analysis record identified by
 * the given UUID. It requires that the caller is an authenticated admin user.
 *
 * @param props - Object containing the authenticated admin user payload and the
 *   sentiment analysis ID to delete.
 * @param props.adminUser - The authenticated admin user performing the
 *   deletion.
 * @param props.sentimentAnalysisId - The UUID of the sentiment analysis record
 *   to delete.
 * @throws {Error} Throws if the record does not exist or Prisma deletion fails.
 */
export async function delete__shoppingMall_adminUser_sentimentAnalysis_$sentimentAnalysisId(props: {
  adminUser: AdminuserPayload;
  sentimentAnalysisId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sentimentAnalysisId } = props;
  await MyGlobal.prisma.shopping_mall_sentiment_analysis.delete({
    where: {
      id: sentimentAnalysisId,
    },
  });
}
