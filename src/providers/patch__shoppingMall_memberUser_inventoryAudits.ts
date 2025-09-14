import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventoryAudit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventoryAudit";
import { IPageIShoppingMallInventoryAudit } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInventoryAudit";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve paginated inventory audit logs.
 *
 * This endpoint allows an authenticated member user to search inventory audit
 * records with filters: inventory ID, actor user ID, change type, and change
 * date ranges. Results are paginated and sorted by change date descending.
 *
 * Write operations are not permitted as the data is system-managed.
 *
 * @param props - The properties including authenticated member user information
 *   and filter parameters.
 * @param props.memberUser - The authenticated member user making the request.
 * @param props.body - Filter and pagination parameters for inventory audits.
 * @returns Paginated inventory audit records matching filters.
 * @throws {Error} Throws if any unexpected error occurs during database access.
 */
export async function patch__shoppingMall_memberUser_inventoryAudits(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallInventoryAudit.IRequest;
}): Promise<IPageIShoppingMallInventoryAudit> {
  const { memberUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const whereCondition = {
    ...(body.inventory_id !== undefined &&
      body.inventory_id !== null && {
        inventory_id: body.inventory_id,
      }),
    ...(body.actor_user_id !== undefined &&
      body.actor_user_id !== null && {
        actor_user_id: body.actor_user_id,
      }),
    ...(body.change_type !== undefined &&
      body.change_type !== null && {
        change_type: body.change_type,
      }),
    ...(() => {
      if (!body.changed_at_from && !body.changed_at_to) return {};
      return {
        changed_at: {
          ...(body.changed_at_from !== undefined &&
            body.changed_at_from !== null && {
              gte: body.changed_at_from,
            }),
          ...(body.changed_at_to !== undefined &&
            body.changed_at_to !== null && {
              lte: body.changed_at_to,
            }),
        },
      };
    })(),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_inventory_audit.findMany({
      where: whereCondition,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { changed_at: "desc" },
    }),
    MyGlobal.prisma.shopping_mall_inventory_audit.count({
      where: whereCondition,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      inventory_id: item.inventory_id,
      actor_user_id: item.actor_user_id ?? null,
      change_type: item.change_type,
      quantity_changed: item.quantity_changed,
      change_reason: item.change_reason ?? null,
      changed_at: toISOStringSafe(item.changed_at),
    })),
  };
}
