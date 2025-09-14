import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { IPageIShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItemOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves a paginated list of selected product option details for the
 * specified cart item.
 *
 * This operation supports filtering by option group, option id, creation and
 * update timestamps. Only admin users are authorized to perform this
 * operation.
 *
 * @param props - Object containing adminUser payload, the cartItemId, and
 *   filter body
 * @param props.adminUser - Authenticated admin user performing the action
 * @param props.cartItemId - UUID of the target cart item
 * @param props.body - Filter criteria for option selections
 * @returns A paginated list of IShoppingMallCartItemOption records matching
 *   filters
 * @throws {Error} When the specified cart item does not exist
 */
export async function patch__shoppingMall_adminUser_cartItems_$cartItemId_cartItemOptions(props: {
  adminUser: AdminuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItemOption.IRequest;
}): Promise<IPageIShoppingMallCartItemOption> {
  const { adminUser, cartItemId, body } = props;

  // Verify existence of cart item (must not be deleted)
  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findFirst({
    where: { id: cartItemId, deleted_at: null },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // Build where condition with filters
  const whereCondition = {
    shopping_cart_item_id: cartItemId,
    ...(body.shopping_sale_option_group_id !== undefined &&
      body.shopping_sale_option_group_id !== null && {
        shopping_sale_option_group_id: body.shopping_sale_option_group_id,
      }),
    ...(body.shopping_sale_option_id !== undefined &&
      body.shopping_sale_option_id !== null && {
        shopping_sale_option_id: body.shopping_sale_option_id,
      }),
    ...(body.created_at !== undefined &&
      body.created_at !== null && {
        created_at: body.created_at,
      }),
    ...(body.updated_at !== undefined &&
      body.updated_at !== null && {
        updated_at: body.updated_at,
      }),
  };

  // Set default pagination parameters
  const page = 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Count total records
  const total = await MyGlobal.prisma.shopping_mall_cart_item_options.count({
    where: whereCondition,
  });

  // Query paginated option selections
  const results =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findMany({
      where: whereCondition,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    });

  // Prepare response data mapping all Date to ISO string
  const data = results.map((item) => ({
    id: item.id,
    shopping_cart_item_id: item.shopping_cart_item_id,
    shopping_sale_option_group_id: item.shopping_sale_option_group_id,
    shopping_sale_option_id: item.shopping_sale_option_id,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
  }));

  return {
    pagination: {
      current: page,
      limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
