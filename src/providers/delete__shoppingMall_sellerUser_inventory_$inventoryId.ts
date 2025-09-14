import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Permanently deletes a specific inventory record identified by its UUID.
 *
 * Only the seller user who owns the inventory (via sale's seller_user_id) can
 * delete the record.
 *
 * @param props - Properties including the authorized seller user and inventory
 *   ID
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion
 * @param props.inventoryId - The UUID of the inventory record to delete
 * @throws {Error} Throws an error if the inventory does not belong to the
 *   seller user
 * @throws {Prisma.PrismaClientKnownRequestError} Throws if the inventory record
 *   does not exist
 */
export async function delete__shoppingMall_sellerUser_inventory_$inventoryId(props: {
  sellerUser: SelleruserPayload;
  inventoryId: string & tags.Format<"uuid">;
}): Promise<void> {
  const inventory =
    await MyGlobal.prisma.shopping_mall_inventory.findUniqueOrThrow({
      where: { id: props.inventoryId },
      include: { sale: true },
    });

  if (inventory.sale.shopping_mall_seller_user_id !== props.sellerUser.id) {
    throw new Error("Unauthorized: Cannot delete inventory of another seller");
  }

  await MyGlobal.prisma.shopping_mall_inventory.delete({
    where: { id: props.inventoryId },
  });
}
