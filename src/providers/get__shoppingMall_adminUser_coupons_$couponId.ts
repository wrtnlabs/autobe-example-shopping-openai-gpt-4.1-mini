import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function get__shoppingMall_adminUser_coupons_$couponId(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCoupon> {
  const { couponId } = props;
  const record = await MyGlobal.prisma.shopping_mall_coupons.findFirstOrThrow({
    where: {
      id: couponId,
      deleted_at: null,
    },
  });

  return {
    shopping_mall_channel_id: record.shopping_mall_channel_id,
    coupon_code: record.coupon_code,
    coupon_name: record.coupon_name,
    coupon_description:
      record.coupon_description === null ? null : record.coupon_description,
    discount_type: record.discount_type as "amount" | "percentage",
    discount_value: record.discount_value,
    max_discount_amount:
      record.max_discount_amount === null ? null : record.max_discount_amount,
    min_order_amount:
      record.min_order_amount === null ? null : record.min_order_amount,
    usage_limit: record.usage_limit === null ? null : record.usage_limit,
    per_customer_limit:
      record.per_customer_limit === null ? null : record.per_customer_limit,
    start_date: toISOStringSafe(record.start_date),
    end_date: toISOStringSafe(record.end_date),
    status: record.status,
  };
}
