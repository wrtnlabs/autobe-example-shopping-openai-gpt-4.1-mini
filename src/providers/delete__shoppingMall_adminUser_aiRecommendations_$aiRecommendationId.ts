import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Permanently deletes an AI recommendation record by its unique ID.
 *
 * This operation enforces that only authenticated admin users may perform the
 * deletion. The deletion is a hard delete, removing the entire record without
 * soft delete.
 *
 * @param props - The properties containing the adminUser token and the AI
 *   recommendation ID.
 * @param props.adminUser - Authenticated admin user performing the deletion.
 * @param props.aiRecommendationId - The UUID of the AI recommendation to
 *   delete.
 * @returns A promise that resolves to void when deletion is successful.
 * @throws {Error} Throws if the AI recommendation does not exist.
 */
export async function delete__shoppingMall_adminUser_aiRecommendations_$aiRecommendationId(props: {
  adminUser: AdminuserPayload;
  aiRecommendationId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, aiRecommendationId } = props;

  await MyGlobal.prisma.shopping_mall_ai_recommendations.delete({
    where: { id: aiRecommendationId },
  });
}
