import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderAuditLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderAuditLog";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve an order audit log by its unique ID.
 *
 * Provides detailed information about actions performed on a specific order,
 * including actor information and action timestamps, for authenticated member
 * users.
 *
 * @param props - Properties including member user authentication and audit log
 *   ID
 * @param props.memberUser - The authenticated member user making the request
 * @param props.id - UUID of the order audit log to retrieve
 * @returns The order audit log record with full details
 * @throws {Error} Throws if the order audit log is not found
 */
export async function get__shoppingMall_memberUser_orderAuditLogs_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrderAuditLog> {
  const { id } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_order_audit_logs.findUniqueOrThrow({
      where: { id },
    });

  return {
    id: record.id,
    shopping_mall_order_id: record.shopping_mall_order_id,
    actor_user_id: record.actor_user_id ?? null,
    action: record.action,
    action_details: record.action_details ?? null,
    performed_at: toISOStringSafe(record.performed_at),
  };
}
