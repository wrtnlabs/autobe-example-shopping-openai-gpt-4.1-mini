import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new shopping mall cart item for the specified cart.
 *
 * This operation requires an authenticated admin user. It validates that the
 * cart exists and then creates a new cart item linkage to a product snapshot.
 *
 * The cart item includes quantity, unit price, status, and timestamps.
 *
 * @param props - Object containing the authenticated adminUser, cartId, and the
 *   cart item body.
 * @param props.adminUser - The authenticated admin user making the request.
 * @param props.cartId - UUID string of the target cart to add the item to.
 * @param props.body - Details about the cart item being created.
 * @returns The newly created cart item with all relevant fields.
 * @throws {Error} Throws if the cart does not exist.
 */
export async function post__shoppingMall_adminUser_carts_$cartId_cartItems(props: {
  adminUser: AdminuserPayload;
  cartId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItem.ICreate;
}): Promise<IShoppingMallCartItem> {
  const { adminUser, cartId, body } = props;

  // Validate the cart exists
  await MyGlobal.prisma.shopping_mall_carts.findUniqueOrThrow({
    where: { id: cartId },
  });

  const now = toISOStringSafe(new Date());

  // Generate a new brand-safe UUID
  const newId = typia.assert<string & tags.Format<"uuid">>(v4());

  // Create the cart item
  const created = await MyGlobal.prisma.shopping_mall_cart_items.create({
    data: {
      id: newId,
      shopping_cart_id: cartId,
      shopping_sale_snapshot_id: body.shopping_sale_snapshot_id,
      quantity: body.quantity,
      unit_price: body.unit_price,
      status: body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  // Return the created item with ISO string dates
  return {
    id: created.id,
    shopping_cart_id: created.shopping_cart_id,
    shopping_sale_snapshot_id: created.shopping_sale_snapshot_id,
    quantity: created.quantity,
    unit_price: created.unit_price,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
