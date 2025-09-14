import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function put__shoppingMall_adminUser_coupons_$couponId(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
  body: IShoppingMallCoupon.IUpdate;
}): Promise<IShoppingMallCoupon> {
  const { adminUser, couponId, body } = props;

  await MyGlobal.prisma.shopping_mall_coupons.findUniqueOrThrow({
    where: { id: couponId },
  });

  const updated = await MyGlobal.prisma.shopping_mall_coupons.update({
    where: { id: couponId },
    data: {
      shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
      coupon_code: body.coupon_code ?? undefined,
      coupon_name: body.coupon_name ?? undefined,
      coupon_description: body.coupon_description ?? null,
      discount_type: body.discount_type ?? undefined,
      discount_value: body.discount_value ?? undefined,
      max_discount_amount: body.max_discount_amount ?? null,
      min_order_amount: body.min_order_amount ?? null,
      usage_limit: body.usage_limit ?? null,
      per_customer_limit: body.per_customer_limit ?? null,
      start_date: body.start_date
        ? toISOStringSafe(body.start_date)
        : undefined,
      end_date: body.end_date ? toISOStringSafe(body.end_date) : undefined,
      status: body.status ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    coupon_code: updated.coupon_code,
    coupon_name: updated.coupon_name ?? null,
    coupon_description: updated.coupon_description ?? null,
    discount_type:
      updated.discount_type === "amount" ||
      updated.discount_type === "percentage"
        ? updated.discount_type
        : "amount",
    discount_value: updated.discount_value,
    max_discount_amount: updated.max_discount_amount ?? null,
    min_order_amount: updated.min_order_amount ?? null,
    usage_limit: updated.usage_limit ?? null,
    per_customer_limit: updated.per_customer_limit ?? null,
    start_date: toISOStringSafe(updated.start_date),
    end_date: toISOStringSafe(updated.end_date),
    status: updated.status ?? null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
