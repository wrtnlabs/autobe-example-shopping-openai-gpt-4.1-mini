import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function post__shoppingMall_adminUser_analyticsDashboards(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAnalyticsDashboard.ICreate;
}): Promise<IShoppingMallAnalyticsDashboard> {
  const id = v4() as string & tags.Format<"uuid">;

  const created =
    await MyGlobal.prisma.shopping_mall_analytics_dashboards.create({
      data: {
        id,
        dashboard_type: props.body.dashboard_type,
        configuration: props.body.configuration,
        last_run_at: props.body.last_run_at,
        status: props.body.status,
        created_at: toISOStringSafe(new Date()),
        updated_at: toISOStringSafe(new Date()),
      },
    });

  return {
    id: created.id as string & tags.Format<"uuid">,
    dashboard_type: created.dashboard_type,
    configuration: created.configuration,
    last_run_at: toISOStringSafe(created.last_run_at),
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
