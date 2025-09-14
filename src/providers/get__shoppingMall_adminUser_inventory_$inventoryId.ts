import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve inventory record by ID
 *
 * This operation retrieves detailed inventory information for a specific option
 * combination of a sales product within the shopping mall system. It returns
 * the inventory details including option combination code and current stock
 * quantity.
 *
 * Authorization: Only accessible by an authenticated admin user.
 *
 * @param props - Object containing admin user and inventory ID
 * @param props.adminUser - Authenticated admin user payload
 * @param props.inventoryId - Unique identifier of the target inventory record
 * @returns Inventory entity data matching IShoppingMallInventory
 * @throws {Error} If the inventory record does not exist or is soft deleted
 */
export async function get__shoppingMall_adminUser_inventory_$inventoryId(props: {
  adminUser: AdminuserPayload;
  inventoryId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallInventory> {
  const { adminUser, inventoryId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_inventory.findUniqueOrThrow({
      where: { id: inventoryId, deleted_at: null },
    });

  return {
    id: record.id,
    shopping_mall_sale_id: record.shopping_mall_sale_id,
    option_combination_code: record.option_combination_code,
    stock_quantity: record.stock_quantity,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
