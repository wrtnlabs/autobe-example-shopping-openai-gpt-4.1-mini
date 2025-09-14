import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function put__shoppingMall_adminUser_dynamicPricings_$dynamicPricingId(props: {
  adminUser: AdminuserPayload;
  dynamicPricingId: string & tags.Format<"uuid">;
  body: IShoppingMallDynamicPricing.IUpdate;
}): Promise<IShoppingMallDynamicPricing> {
  const { adminUser, dynamicPricingId, body } = props;

  await MyGlobal.prisma.shopping_mall_dynamic_pricing.findUniqueOrThrow({
    where: { id: dynamicPricingId },
  });

  const updated = await MyGlobal.prisma.shopping_mall_dynamic_pricing.update({
    where: { id: dynamicPricingId },
    data: {
      product_id:
        body.product_id !== undefined && body.product_id !== null
          ? body.product_id
          : undefined,
      pricing_rule_id:
        body.pricing_rule_id !== undefined && body.pricing_rule_id !== null
          ? body.pricing_rule_id
          : undefined,
      adjusted_price:
        body.adjusted_price !== undefined && body.adjusted_price !== null
          ? body.adjusted_price
          : undefined,
      algorithm_version:
        body.algorithm_version !== undefined && body.algorithm_version !== null
          ? body.algorithm_version
          : undefined,
      status:
        body.status !== undefined && body.status !== null
          ? body.status
          : undefined,
      effective_from:
        body.effective_from !== undefined && body.effective_from !== null
          ? toISOStringSafe(body.effective_from)
          : undefined,
      effective_to:
        body.effective_to !== undefined
          ? body.effective_to === null
            ? null
            : toISOStringSafe(body.effective_to)
          : undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id as string & tags.Format<"uuid">,
    product_id: updated.product_id as string & tags.Format<"uuid">,
    pricing_rule_id: updated.pricing_rule_id as string & tags.Format<"uuid">,
    adjusted_price: updated.adjusted_price,
    algorithm_version: updated.algorithm_version,
    status: updated.status,
    effective_from: toISOStringSafe(updated.effective_from),
    effective_to: updated.effective_to
      ? toISOStringSafe(updated.effective_to)
      : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
