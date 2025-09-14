import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve detailed dynamic pricing information by its unique ID.
 *
 * This function fetches the dynamic pricing record from the database identified
 * by the provided `dynamicPricingId`. All date fields are converted to ISO
 * string format to comply with API contracts.
 *
 * Authorization is enforced by requiring an authenticated admin user.
 *
 * @param props - Request properties including authorization and dynamic pricing
 *   ID
 * @param props.adminUser - Authenticated administrator user payload
 * @param props.dynamicPricingId - The UUID of the dynamic pricing record to
 *   retrieve
 * @returns Detailed dynamic pricing data conforming to
 *   IShoppingMallDynamicPricing
 * @throws {Error} Throws if the record is not found or if unauthorized access
 *   occurs
 */
export async function get__shoppingMall_adminUser_dynamicPricings_$dynamicPricingId(props: {
  adminUser: AdminuserPayload;
  dynamicPricingId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallDynamicPricing> {
  const { adminUser, dynamicPricingId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_dynamic_pricing.findUniqueOrThrow({
      where: { id: dynamicPricingId },
    });

  return {
    id: record.id,
    product_id: record.product_id,
    pricing_rule_id: record.pricing_rule_id,
    adjusted_price: record.adjusted_price,
    algorithm_version: record.algorithm_version,
    status: record.status,
    effective_from: toISOStringSafe(record.effective_from),
    effective_to: record.effective_to
      ? toISOStringSafe(record.effective_to)
      : null,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
  };
}
