import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieve inventory record by ID.
 *
 * This operation retrieves detailed inventory information for a specific option
 * combination of a sales product within the shopping mall system. The inventory
 * entity records stock quantities per unique combination of sale product
 * options. Provides current stock levels and availability for display.
 *
 * Authorization is enforced by requiring a valid authenticated sellerUser.
 * Soft-deleted records are excluded from results.
 *
 * @param props - Object containing sellerUser payload and inventoryId path
 *   parameter.
 * @param props.sellerUser - Authenticated seller user making the request.
 * @param props.inventoryId - UUID identifying the inventory record.
 * @returns The inventory entity including sale ID, option code, stock quantity,
 *   and timestamps.
 * @throws {Error} Thrown if inventory record is not found or has been deleted.
 */
export async function get__shoppingMall_sellerUser_inventory_$inventoryId(props: {
  sellerUser: SelleruserPayload;
  inventoryId: string & import("typia").tags.Format<"uuid">;
}): Promise<IShoppingMallInventory> {
  const { sellerUser, inventoryId } = props;

  // Authorization is assumed to be handled externally

  const inventory =
    await MyGlobal.prisma.shopping_mall_inventory.findFirstOrThrow({
      where: {
        id: inventoryId,
        deleted_at: null,
      },
    });

  return {
    id: inventory.id,
    shopping_mall_sale_id: inventory.shopping_mall_sale_id,
    option_combination_code: inventory.option_combination_code,
    stock_quantity: inventory.stock_quantity,
    created_at: toISOStringSafe(inventory.created_at),
    updated_at: toISOStringSafe(inventory.updated_at),
    deleted_at: inventory.deleted_at
      ? toISOStringSafe(inventory.deleted_at)
      : null,
  };
}
