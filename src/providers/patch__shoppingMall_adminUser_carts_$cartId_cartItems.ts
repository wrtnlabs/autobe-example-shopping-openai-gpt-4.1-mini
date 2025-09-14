import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { IPageIShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_carts_$cartId_cartItems(props: {
  adminUser: AdminuserPayload;
  cartId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItem.IRequest;
}): Promise<IPageIShoppingMallCartItem> {
  const { adminUser, cartId, body } = props;

  // Verify the cart exists using findUniqueOrThrow (throws 404 error if not found)
  await MyGlobal.prisma.shopping_mall_carts.findUniqueOrThrow({
    where: { id: cartId },
  });

  // Build where condition
  const whereCondition = {
    shopping_cart_id: cartId,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
  };

  // Pagination parameters with defaults
  const currentPage = body.page ?? 1;
  const limit = body.limit ?? 20;
  const skip = (currentPage - 1) * limit;

  // Parse orderBy string to Prisma orderBy object or fallback to created_at desc
  const orderByCondition = body.orderBy
    ? (() => {
        const [field, order] = body.orderBy.split(/\s+/);
        return { [field]: order?.toLowerCase() === "asc" ? "asc" : "desc" };
      })()
    : { created_at: "desc" };

  // Fetch data and total count in parallel
  const [items, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_cart_items.findMany({
      where: whereCondition,
      orderBy: orderByCondition,
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_cart_items.count({ where: whereCondition }),
  ]);

  // Map data with date conversions and nullable deleted_at
  const data = items.map((item) => ({
    id: item.id as string & tags.Format<"uuid">,
    shopping_cart_id: item.shopping_cart_id as string & tags.Format<"uuid">,
    shopping_sale_snapshot_id: item.shopping_sale_snapshot_id as string &
      tags.Format<"uuid">,
    quantity: item.quantity as number & tags.Type<"int32">,
    unit_price: item.unit_price,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
    deleted_at: item.deleted_at ? toISOStringSafe(item.deleted_at) : null,
    status: item.status,
  }));

  return {
    pagination: {
      current: Number(currentPage),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
