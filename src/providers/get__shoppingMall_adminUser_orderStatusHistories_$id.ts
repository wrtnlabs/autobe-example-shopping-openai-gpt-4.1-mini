import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderStatusHistory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderStatusHistory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a detailed order status history record by its unique ID.
 *
 * Accessible only by adminUser role; authorization should be enforced
 * externally.
 *
 * @param props - Object containing the authenticated adminUser and the target
 *   record ID
 * @param props.adminUser - Authenticated administrator user performing the
 *   request
 * @param props.id - The unique UUID of the order status history record to
 *   retrieve
 * @returns The detailed order status history record matching the given ID
 * @throws {Error} Throws if no record with the given ID is found
 */
export async function get__shoppingMall_adminUser_orderStatusHistories_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrderStatusHistory> {
  const record =
    await MyGlobal.prisma.shopping_mall_order_status_histories.findUniqueOrThrow(
      {
        where: { id: props.id },
      },
    );

  return {
    id: record.id,
    shopping_mall_order_id: record.shopping_mall_order_id,
    old_status: record.old_status,
    new_status: record.new_status,
    changed_at: toISOStringSafe(record.changed_at),
  };
}
