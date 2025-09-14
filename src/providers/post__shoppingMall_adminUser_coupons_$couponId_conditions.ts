import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponCondition";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create coupon condition record
 *
 * Creates a new coupon condition under the specified couponId. Requires
 * adminUser authorization. Accepts creation data such as condition type,
 * targeted product/section/category. Returns the newly created coupon condition
 * entity.
 *
 * @param props - Object containing adminUser authorization, couponId, and the
 *   creation payload
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.couponId - UUID of the coupon to associate the condition with
 * @param props.body - Payload containing coupon condition creation data
 * @returns The newly created coupon condition entity
 * @throws {Error} Throws if database operation fails
 */
export async function post__shoppingMall_adminUser_coupons_$couponId_conditions(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
  body: IShoppingMallCouponCondition.ICreate;
}): Promise<IShoppingMallCouponCondition> {
  const { couponId, body } = props;
  const now = toISOStringSafe(new Date());
  const newId = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_coupon_conditions.create({
    data: {
      id: newId,
      shopping_mall_coupon_id: couponId,
      condition_type: body.condition_type,
      product_id: body.product_id !== undefined ? body.product_id : null,
      section_id: body.section_id !== undefined ? body.section_id : null,
      category_id: body.category_id !== undefined ? body.category_id : null,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    shopping_mall_coupon_id: created.shopping_mall_coupon_id,
    condition_type: created.condition_type,
    product_id: created.product_id ?? null,
    section_id: created.section_id ?? null,
    category_id: created.category_id ?? null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
