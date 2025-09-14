import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Create a new inventory record to track stock quantities for a specific sale
 * product option combination.
 *
 * This operation requires sellerUser authorization.
 *
 * @param props - Object containing sellerUser authentication and inventory
 *   creation data
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.body - Inventory creation data including sale product ID, option
 *   combination code, and stock quantity
 * @returns The newly created inventory entity with all persisted fields
 *   including timestamps
 * @throws {Error} When database creation fails
 */
export async function post__shoppingMall_sellerUser_inventory(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallInventory.ICreate;
}): Promise<IShoppingMallInventory> {
  const { sellerUser, body } = props;

  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_inventory.create({
    data: {
      id,
      shopping_mall_sale_id: body.shopping_mall_sale_id,
      option_combination_code: body.option_combination_code,
      stock_quantity: body.stock_quantity,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    shopping_mall_sale_id: created.shopping_mall_sale_id,
    option_combination_code: created.option_combination_code,
    stock_quantity: created.stock_quantity,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
