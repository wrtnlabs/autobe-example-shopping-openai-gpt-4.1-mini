import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";
import { IPageIShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAnalyticsDashboard";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_analyticsDashboards(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAnalyticsDashboard.IRequest;
}): Promise<IPageIShoppingMallAnalyticsDashboard.ISummary> {
  const { adminUser, body } = props;

  const where: Record<string, unknown> = { deleted_at: null };
  if (body.dashboard_type !== undefined && body.dashboard_type !== null) {
    where.dashboard_type = body.dashboard_type;
  }
  if (body.status !== undefined && body.status !== null) {
    where.status = body.status;
  }
  if (body.last_run_after !== undefined && body.last_run_after !== null) {
    where.last_run_at = {
      gte: body.last_run_after,
    };
  }

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;
  const skip = (page - 1) * limit;

  const orderBy =
    body.sortBy && body.sortOrder
      ? {
          [body.sortBy]: (body.sortOrder.toLowerCase() === "asc"
            ? "asc"
            : "desc") as "asc" | "desc",
        }
      : { created_at: "desc" as const };

  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_analytics_dashboards.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        dashboard_type: true,
        last_run_at: true,
        status: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_analytics_dashboards.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((row) => ({
      id: row.id,
      dashboard_type: row.dashboard_type,
      last_run_at: toISOStringSafe(row.last_run_at),
      status: row.status,
    })),
  };
}
