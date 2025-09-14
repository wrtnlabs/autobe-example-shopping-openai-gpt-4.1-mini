import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Soft delete an analytics dashboard by its ID.
 *
 * This function marks the record as deleted by setting the deleted_at
 * timestamp. Only authorized adminUser may perform this operation.
 *
 * @param props - Object containing the adminUser and analyticsDashboardId
 * @param props.adminUser - The authorized admin user performing the deletion
 * @param props.analyticsDashboardId - The UUID of the analytics dashboard to
 *   soft delete
 * @returns Void
 * @throws {Error} Throws if the analytics dashboard does not exist (404)
 */
export async function delete__shoppingMall_adminUser_analyticsDashboards_$analyticsDashboardId(props: {
  adminUser: AdminuserPayload;
  analyticsDashboardId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, analyticsDashboardId } = props;

  const dashboard =
    await MyGlobal.prisma.shopping_mall_analytics_dashboards.findUniqueOrThrow({
      where: { id: analyticsDashboardId },
    });

  await MyGlobal.prisma.shopping_mall_analytics_dashboards.update({
    where: { id: analyticsDashboardId },
    data: { deleted_at: toISOStringSafe(new Date()) },
  });

  return;
}
