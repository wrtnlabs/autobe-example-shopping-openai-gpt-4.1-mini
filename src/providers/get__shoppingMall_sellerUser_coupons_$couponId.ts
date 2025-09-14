import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieve detailed coupon information by coupon ID for authorized seller
 * users.
 *
 * Retrieves coupon definition, usage limits, validity range, discount details,
 * and status from the shopping_mall_coupons table.
 *
 * Access control is enforced by prior authorization middleware ensuring the
 * caller is an authorized seller user.
 *
 * @param props - Object containing seller user payload and target coupon ID
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.couponId - UUID string identifying the coupon to retrieve
 * @returns Detailed coupon information conforming to IShoppingMallCoupon
 * @throws {Error} Throws if the coupon does not exist or is deleted
 */
export async function get__shoppingMall_sellerUser_coupons_$couponId(props: {
  sellerUser: SelleruserPayload;
  couponId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCoupon> {
  const { couponId } = props;

  const coupon = await MyGlobal.prisma.shopping_mall_coupons.findUniqueOrThrow({
    where: { id: couponId, deleted_at: null },
    select: {
      shopping_mall_channel_id: true,
      coupon_code: true,
      coupon_name: true,
      coupon_description: true,
      discount_type: true,
      discount_value: true,
      max_discount_amount: true,
      min_order_amount: true,
      usage_limit: true,
      per_customer_limit: true,
      start_date: true,
      end_date: true,
      status: true,
    },
  });

  return {
    shopping_mall_channel_id: coupon.shopping_mall_channel_id,
    coupon_code: coupon.coupon_code,
    coupon_name: coupon.coupon_name,
    coupon_description: coupon.coupon_description,
    discount_type: coupon.discount_type as "amount" | "percentage",
    discount_value: coupon.discount_value,
    max_discount_amount: coupon.max_discount_amount,
    min_order_amount: coupon.min_order_amount,
    usage_limit: coupon.usage_limit,
    per_customer_limit: coupon.per_customer_limit,
    start_date: toISOStringSafe(coupon.start_date),
    end_date: toISOStringSafe(coupon.end_date),
    status: coupon.status,
  };
}
