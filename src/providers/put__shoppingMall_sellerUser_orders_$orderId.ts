import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function put__shoppingMall_sellerUser_orders_$orderId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrder.IUpdate;
}): Promise<IShoppingMallOrder> {
  const { sellerUser, orderId, body } = props;

  // Fetch the existing order to verify it exists
  await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  // Perform the update operation inline without intermediate variable
  const updated = await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: {
      shopping_mall_memberuser_id:
        body.shopping_mall_memberuser_id ?? undefined,
      shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
      shopping_mall_section_id: body.shopping_mall_section_id ?? undefined,
      order_code: body.order_code ?? undefined,
      order_status: body.order_status ?? undefined,
      payment_status: body.payment_status ?? undefined,
      total_price: body.total_price ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_memberuser_id: updated.shopping_mall_memberuser_id,
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    shopping_mall_section_id: updated.shopping_mall_section_id ?? null,
    order_code: updated.order_code,
    order_status: updated.order_status,
    payment_status: updated.payment_status,
    total_price: updated.total_price,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
