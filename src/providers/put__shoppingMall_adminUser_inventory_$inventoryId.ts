import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update inventory record by ID
 *
 * Updates specific inventory record with new stock quantity or option
 * combination code. Requires inventory ID path parameter and request body
 * containing updated inventory details. Only authorized admin users may perform
 * this operation.
 *
 * @param props - Object containing adminUser credentials, inventory ID, and
 *   update body
 * @param props.adminUser - Authenticated admin user performing the update
 * @param props.inventoryId - UUID of the inventory item to update
 * @param props.body - Partial inventory data with fields to update
 * @returns Updated inventory item with all relevant fields
 * @throws {Error} Throws error if inventory item with specified ID does not
 *   exist
 */
export async function put__shoppingMall_adminUser_inventory_$inventoryId(props: {
  adminUser: AdminuserPayload;
  inventoryId: string & tags.Format<"uuid">;
  body: IShoppingMallInventory.IUpdate;
}): Promise<IShoppingMallInventory> {
  const { adminUser, inventoryId, body } = props;

  const inventory = await MyGlobal.prisma.shopping_mall_inventory.findUnique({
    where: { id: inventoryId },
  });

  if (!inventory) throw new Error("Inventory record not found");

  const updated = await MyGlobal.prisma.shopping_mall_inventory.update({
    where: { id: inventoryId },
    data: {
      shopping_mall_sale_id:
        body.shopping_mall_sale_id === null
          ? undefined
          : (body.shopping_mall_sale_id ?? undefined),
      option_combination_code:
        body.option_combination_code === null
          ? undefined
          : (body.option_combination_code ?? undefined),
      stock_quantity:
        body.stock_quantity === null
          ? undefined
          : (body.stock_quantity ?? undefined),
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
    },
  });

  return {
    id: updated.id,
    shopping_mall_sale_id: updated.shopping_mall_sale_id,
    option_combination_code: updated.option_combination_code,
    stock_quantity: updated.stock_quantity,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
