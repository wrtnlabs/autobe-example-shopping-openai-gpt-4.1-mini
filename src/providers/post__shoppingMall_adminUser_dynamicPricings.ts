import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function post__shoppingMall_adminUser_dynamicPricings(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallDynamicPricing.ICreate;
}): Promise<IShoppingMallDynamicPricing> {
  if (props.adminUser.type !== "adminuser") {
    throw new Error("Unauthorized: adminuser role required");
  }

  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_dynamic_pricing.create({
    data: {
      id,
      product_id: props.body.product_id,
      pricing_rule_id: props.body.pricing_rule_id,
      adjusted_price: props.body.adjusted_price,
      algorithm_version: props.body.algorithm_version,
      status: props.body.status,
      effective_from: props.body.effective_from,
      effective_to: props.body.effective_to ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    product_id: created.product_id,
    pricing_rule_id: created.pricing_rule_id,
    adjusted_price: created.adjusted_price,
    algorithm_version: created.algorithm_version,
    status: created.status,
    effective_from: created.effective_from as string & tags.Format<"date-time">,
    effective_to: created.effective_to
      ? (created.effective_to as string & tags.Format<"date-time">)
      : null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
