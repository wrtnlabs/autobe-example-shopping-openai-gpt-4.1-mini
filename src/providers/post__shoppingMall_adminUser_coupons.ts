import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function post__shoppingMall_adminUser_coupons(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallCoupon.ICreate;
}): Promise<Omit<IShoppingMallCoupon, "id">> {
  const { adminUser, body } = props;

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_coupons.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_channel_id: body.shopping_mall_channel_id,
      coupon_code: body.coupon_code,
      coupon_name: body.coupon_name,
      coupon_description: body.coupon_description ?? null,
      discount_type: body.discount_type as "amount" | "percentage",
      discount_value: body.discount_value,
      max_discount_amount: body.max_discount_amount ?? null,
      min_order_amount: body.min_order_amount ?? null,
      usage_limit: body.usage_limit ?? null,
      per_customer_limit: body.per_customer_limit ?? null,
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    shopping_mall_channel_id: created.shopping_mall_channel_id,
    coupon_code: created.coupon_code,
    coupon_name: created.coupon_name,
    coupon_description: created.coupon_description ?? null,
    discount_type: created.discount_type as "amount" | "percentage",
    discount_value: created.discount_value,
    max_discount_amount: created.max_discount_amount ?? null,
    min_order_amount: created.min_order_amount ?? null,
    usage_limit: created.usage_limit ?? null,
    per_customer_limit: created.per_customer_limit ?? null,
    start_date: toISOStringSafe(created.start_date),
    end_date: toISOStringSafe(created.end_date),
    status: created.status,
  };
}
