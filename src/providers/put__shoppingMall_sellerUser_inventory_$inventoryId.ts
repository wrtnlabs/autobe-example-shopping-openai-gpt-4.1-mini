import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function put__shoppingMall_sellerUser_inventory_$inventoryId(props: {
  sellerUser: SelleruserPayload;
  inventoryId: string & tags.Format<"uuid">;
  body: IShoppingMallInventory.IUpdate;
}): Promise<IShoppingMallInventory> {
  const { sellerUser, inventoryId, body } = props;

  // Ensure the inventory exists
  await MyGlobal.prisma.shopping_mall_inventory.findUniqueOrThrow({
    where: { id: inventoryId },
  });

  // Perform the update operation
  const updated = await MyGlobal.prisma.shopping_mall_inventory.update({
    where: { id: inventoryId },
    data: {
      ...(body.shopping_mall_sale_id !== undefined &&
        body.shopping_mall_sale_id !== null && {
          shopping_mall_sale_id: body.shopping_mall_sale_id,
        }),
      ...(body.option_combination_code !== undefined &&
        body.option_combination_code !== null && {
          option_combination_code: body.option_combination_code,
        }),
      ...(body.stock_quantity !== undefined &&
        body.stock_quantity !== null && {
          stock_quantity: body.stock_quantity,
        }),
      ...(body.deleted_at !== undefined && { deleted_at: body.deleted_at }),
      updated_at: toISOStringSafe(new Date()),
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
