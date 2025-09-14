import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate successful retrieval of coupon detail by couponId for
 * authenticated memberUser.
 *
 * This test flow covers the complete scenario:
 *
 * 1. Create and authenticate a member user using the join API.
 * 2. Using the authenticated context, query detailed coupon information by
 *    couponId.
 * 3. Validate that the returned coupon data includes all required and optional
 *    fields conforming exactly to the coupon schema.
 * 4. Confirm that discount_type is either "amount" or "percentage".
 * 5. Ensure use of correct couponId format and authorization context.
 * 6. All response data is type-validated with typia.assert to confirm API
 *    contract fidelity.
 */
export async function test_api_coupon_detail_get_memberuser_success(
  connection: api.IConnection,
) {
  // Step 1: Member user joins and authenticates
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser = await api.functional.auth.memberUser.join(connection, {
    body: createBody,
  });
  typia.assert(authorizedUser);

  // MemberUser is authenticated, token is automatically handled

  // Step 2: Prepare a couponId to query (simulate a valid UUID)
  const couponId = typia.random<string & tags.Format<"uuid">>();

  // Step 3: Get detailed coupon info
  const coupon = await api.functional.shoppingMall.memberUser.coupons.at(
    connection,
    {
      couponId,
    },
  );

  // Step 4: Assert coupon data
  typia.assert(coupon);

  TestValidator.predicate(
    "discount_type is 'amount' or 'percentage'",
    coupon.discount_type === "amount" || coupon.discount_type === "percentage",
  );

  // Optional nullable string coupon_description validation
  TestValidator.predicate(
    "coupon_description is null, undefined, or string",
    coupon.coupon_description === null ||
      coupon.coupon_description === undefined ||
      typeof coupon.coupon_description === "string",
  );

  // Optional nullable numbers: max_discount_amount, min_order_amount, usage_limit, per_customer_limit
  TestValidator.predicate(
    "max_discount_amount is number or null/undefined",
    coupon.max_discount_amount === null ||
      coupon.max_discount_amount === undefined ||
      typeof coupon.max_discount_amount === "number",
  );
  TestValidator.predicate(
    "min_order_amount is number or null/undefined",
    coupon.min_order_amount === null ||
      coupon.min_order_amount === undefined ||
      typeof coupon.min_order_amount === "number",
  );
  TestValidator.predicate(
    "usage_limit is number or null/undefined",
    coupon.usage_limit === null ||
      coupon.usage_limit === undefined ||
      typeof coupon.usage_limit === "number",
  );
  TestValidator.predicate(
    "per_customer_limit is number or null/undefined",
    coupon.per_customer_limit === null ||
      coupon.per_customer_limit === undefined ||
      typeof coupon.per_customer_limit === "number",
  );

  // Validate dates and formats
  TestValidator.predicate(
    "start_date is ISO 8601 string",
    typeof coupon.start_date === "string",
  );
  TestValidator.predicate(
    "end_date is ISO 8601 string",
    typeof coupon.end_date === "string",
  );

  // Validate status is string
  TestValidator.predicate(
    "status is string",
    typeof coupon.status === "string",
  );
}
