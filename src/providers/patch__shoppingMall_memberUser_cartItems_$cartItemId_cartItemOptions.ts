import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { IPageIShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItemOption";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function patch__shoppingMall_memberUser_cartItems_$cartItemId_cartItemOptions(props: {
  memberUser: MemberuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItemOption.IRequest;
}): Promise<IPageIShoppingMallCartItemOption> {
  const { memberUser, cartItemId, body } = props;

  // Authorization check: ensure the cart item exists and is not deleted
  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findFirst({
    where: {
      id: cartItemId,
      deleted_at: null,
      // Note: member_user_id does not exist in schema, so we cannot filter by it here
    },
  });

  if (!cartItem)
    throw new Error(
      `Cart item not found or not accessible for id ${cartItemId}`,
    );

  // Build the filtering conditions
  const where = {
    shopping_cart_item_id: cartItemId,
    ...(body.shopping_cart_item_id !== undefined &&
      body.shopping_cart_item_id !== null && {
        shopping_cart_item_id: body.shopping_cart_item_id,
      }),
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

  // Use default pagination
  const page = 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Fetch paginated results
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_cart_item_options.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_cart_item_options.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((option) => ({
      id: option.id,
      shopping_cart_item_id: option.shopping_cart_item_id,
      shopping_sale_option_group_id: option.shopping_sale_option_group_id,
      shopping_sale_option_id: option.shopping_sale_option_id,
      created_at: toISOStringSafe(option.created_at),
      updated_at: toISOStringSafe(option.updated_at),
    })),
  };
}
