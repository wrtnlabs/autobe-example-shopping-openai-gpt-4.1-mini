import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventoryAudit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventoryAudit";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve an inventory audit record by its unique identifier.
 *
 * This operation fetches detailed stock change information, including actor
 * user ID, change type (addition, subtraction, adjustment), quantity affected,
 * optional reason, and the timestamp when the change was recorded.
 *
 * Access is restricted to authenticated member users. If the record does not
 * exist, an error is thrown.
 *
 * @param props - Object containing memberUser authentication and inventory
 *   audit ID.
 * @param props.memberUser - Authenticated member user making the request.
 * @param props.id - Unique UUID of the inventory audit record.
 * @returns The inventory audit record matching the specified ID.
 * @throws {Error} When the record with the given ID does not exist.
 */
export async function get__shoppingMall_memberUser_inventoryAudits_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallInventoryAudit> {
  const { memberUser, id } = props;

  const audit =
    await MyGlobal.prisma.shopping_mall_inventory_audit.findUniqueOrThrow({
      where: { id },
    });

  return {
    id: audit.id,
    inventory_id: audit.inventory_id,
    actor_user_id: audit.actor_user_id ?? null,
    change_type: audit.change_type,
    quantity_changed: audit.quantity_changed,
    change_reason: audit.change_reason ?? null,
    changed_at: toISOStringSafe(audit.changed_at),
  };
}
