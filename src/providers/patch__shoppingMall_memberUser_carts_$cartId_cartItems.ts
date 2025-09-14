import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { IPageIShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieves a paginated list of cart items filtered by status from the
 * specified member user's cart.
 *
 * This function validates that the cart belongs to the authenticated member
 * user, applies optional filtering by status, sorting, and pagination
 * parameters.
 *
 * @param props - Object containing memberUser payload, cartId, and
 *   filter/pagination body
 * @param props.memberUser - Authenticated member user's payload
 * @param props.cartId - UUID of the shopping cart
 * @param props.body - Filtering and pagination criteria for cart items
 * @returns A paginated list of shopping mall cart items matching the criteria
 * @throws {Error} Throws if the cart does not exist or does not belong to the
 *   member user
 */
export async function patch__shoppingMall_memberUser_carts_$cartId_cartItems(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItem.IRequest;
}): Promise<IPageIShoppingMallCartItem> {
  const { memberUser, cartId, body } = props;

  const cart = await MyGlobal.prisma.shopping_mall_carts.findFirst({
    where: { id: cartId, member_user_id: memberUser.id },
  });
  if (!cart) throw new Error("Cart not found");

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

  const whereCondition = {
    shopping_cart_id: cartId,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
  };

  let orderByField = "created_at";
  let orderByDirection: "asc" | "desc" = "desc";
  if (body.orderBy) {
    const parts = body.orderBy.trim().split(/\s+/);
    if (parts.length === 2) {
      orderByField = parts[0];
      if (
        parts[1].toLowerCase() === "asc" ||
        parts[1].toLowerCase() === "desc"
      ) {
        orderByDirection = parts[1].toLowerCase() === "asc" ? "asc" : "desc";
      }
    }
  }

  const validFields = [
    "created_at",
    "updated_at",
    "quantity",
    "unit_price",
    "status",
  ];
  if (!validFields.includes(orderByField)) orderByField = "created_at";

  const [items, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_cart_items.findMany({
      where: whereCondition,
      orderBy: { [orderByField]: orderByDirection },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_cart_items.count({ where: whereCondition }),
  ]);

  const data = items.map((item) => ({
    id: item.id,
    shopping_cart_id: item.shopping_cart_id,
    shopping_sale_snapshot_id: item.shopping_sale_snapshot_id,
    quantity: (item.quantity ?? 0) as number &
      tags.Type<"int32"> &
      tags.Minimum<0>,
    unit_price: item.unit_price ?? 0,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
    deleted_at: item.deleted_at ? toISOStringSafe(item.deleted_at) : null,
    status: item.status,
  }));

  const pages = Math.ceil(total / limit);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: pages,
    },
    data,
  };
}
