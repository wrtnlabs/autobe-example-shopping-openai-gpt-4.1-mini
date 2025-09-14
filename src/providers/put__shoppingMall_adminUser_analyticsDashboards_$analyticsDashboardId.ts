import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing analytics dashboard by its ID with new configuration and
 * metadata.
 *
 * Requires adminUser authorization.
 *
 * @param props - Object containing:
 *
 *   - AdminUser: The authenticated admin user performing the update
 *   - AnalyticsDashboardId: UUID string identifying the dashboard to update
 *   - Body: Analytics dashboard update information including dashboard_type,
 *       configuration (JSON string), last_run_at datetime, status, and optional
 *       deleted_at
 *
 * @returns The updated analytics dashboard with full metadata
 * @throws {Error} If the specified dashboard does not exist (404)
 * @throws {Error} If dashboard_type uniqueness is violated (409 Conflict)
 */
export async function put__shoppingMall_adminUser_analyticsDashboards_$analyticsDashboardId(props: {
  adminUser: AdminuserPayload;
  analyticsDashboardId: string & tags.Format<"uuid">;
  body: IShoppingMallAnalyticsDashboard.IUpdate;
}): Promise<IShoppingMallAnalyticsDashboard> {
  const { adminUser, analyticsDashboardId, body } = props;

  // Verify existence
  const existingDashboard =
    await MyGlobal.prisma.shopping_mall_analytics_dashboards.findUnique({
      where: { id: analyticsDashboardId },
    });
  if (!existingDashboard) {
    throw new Error(`Analytics dashboard not found: ${analyticsDashboardId}`);
  }

  // Check uniqueness if dashboard_type is changing
  if (
    body.dashboard_type !== undefined &&
    body.dashboard_type !== existingDashboard.dashboard_type
  ) {
    const conflictingDashboard =
      await MyGlobal.prisma.shopping_mall_analytics_dashboards.findFirst({
        where: {
          dashboard_type: body.dashboard_type,
          deleted_at: null,
          id: { not: analyticsDashboardId },
        },
      });

    if (conflictingDashboard) {
      throw new Error(
        `Conflict: dashboard_type '${body.dashboard_type}' already exists.`,
      );
    }
  }

  const updated =
    await MyGlobal.prisma.shopping_mall_analytics_dashboards.update({
      where: { id: analyticsDashboardId },
      data: {
        dashboard_type: body.dashboard_type ?? undefined,
        configuration: body.configuration ?? undefined,
        last_run_at: body.last_run_at ?? undefined,
        status: body.status ?? undefined,
        deleted_at: body.deleted_at === undefined ? undefined : body.deleted_at,
      },
    });

  return {
    id: updated.id,
    dashboard_type: updated.dashboard_type,
    configuration: updated.configuration,
    last_run_at: toISOStringSafe(updated.last_run_at),
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
