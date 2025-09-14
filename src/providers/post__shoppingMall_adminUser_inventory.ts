import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new inventory record to track stock quantities for a specific sale
 * product option combination.
 *
 * This operation ensures that the referenced sale product exists before
 * creating the inventory entry. It generates a new UUID for the inventory
 * record.
 *
 * Authorization is restricted to admin users.
 *
 * @param props - Object containing the authenticated adminUser and inventory
 *   creation body
 * @param props.adminUser - The authenticated admin user performing the
 *   operation
 * @param props.body - Inventory creation data containing sale product id,
 *   option combination code, and stock quantity
 * @returns The created inventory entity with timestamps
 * @throws {Error} When the referenced sale product does not exist
 */
export async function post__shoppingMall_adminUser_inventory(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallInventory.ICreate;
}): Promise<IShoppingMallInventory> {
  const { adminUser, body } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: body.shopping_mall_sale_id },
  });

  if (!sale) {
    throw new Error("Invalid sale product ID");
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_inventory.create({
    data: {
      id: v4(),
      shopping_mall_sale_id: body.shopping_mall_sale_id,
      option_combination_code: body.option_combination_code,
      stock_quantity: body.stock_quantity,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    shopping_mall_sale_id: created.shopping_mall_sale_id,
    option_combination_code: created.option_combination_code,
    stock_quantity: created.stock_quantity,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}
