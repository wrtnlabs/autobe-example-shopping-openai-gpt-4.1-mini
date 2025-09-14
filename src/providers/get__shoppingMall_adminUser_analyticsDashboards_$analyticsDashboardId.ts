import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a specific shopping mall analytics dashboard by its unique ID.
 *
 * This operation is exclusively accessible by authenticated admin users. It
 * fetches detailed configuration and status information of the requested
 * analytics dashboard, including timestamps with soft delete handling.
 *
 * @param props - Props containing the authenticated adminUser and the dashboard
 *   ID
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.analyticsDashboardId - UUID of the analytics dashboard to
 *   retrieve
 * @returns The detailed analytics dashboard information
 * @throws {Error} If the analytics dashboard with the specified ID does not
 *   exist
 */
export async function get__shoppingMall_adminUser_analyticsDashboards_$analyticsDashboardId(props: {
  adminUser: AdminuserPayload;
  analyticsDashboardId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallAnalyticsDashboard> {
  const { analyticsDashboardId } = props;

  const dashboard =
    await MyGlobal.prisma.shopping_mall_analytics_dashboards.findFirst({
      where: {
        id: analyticsDashboardId,
        deleted_at: null,
      },
    });

  if (!dashboard) {
    throw new Error("Analytics dashboard not found");
  }

  return {
    id: dashboard.id,
    dashboard_type: dashboard.dashboard_type,
    configuration: dashboard.configuration,
    last_run_at: toISOStringSafe(dashboard.last_run_at),
    status: dashboard.status,
    created_at: toISOStringSafe(dashboard.created_at),
    updated_at: toISOStringSafe(dashboard.updated_at),
    deleted_at: dashboard.deleted_at
      ? toISOStringSafe(dashboard.deleted_at)
      : null,
  };
}
