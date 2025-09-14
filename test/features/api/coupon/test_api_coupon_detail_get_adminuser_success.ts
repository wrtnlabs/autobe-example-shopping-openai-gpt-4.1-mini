import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

/**
 * Validates successful retrieval of detailed coupon information for an
 * authenticated admin user.
 *
 * Business context: The admin user is first created and authenticated using
 * the join API, obtaining a JWT token. Using this authenticated context,
 * the test retrieves coupon details by couponId, verifying
 * business-critical coupon fields. This ensures the coupon API behaves
 * correctly for authorized admin users.
 *
 * Test steps:
 *
 * 1. Create and authenticate admin user via /auth/adminUser/join.
 * 2. Generate random UUID couponId.
 * 3. Retrieve coupon details with GET
 *    /shoppingMall/adminUser/coupons/{couponId}.
 * 4. Assert the response type matches IShoppingMallCoupon.
 * 5. Verify important coupon fields including discount_type enum, date-time
 *    formats, and nullable fields.
 * 6. Use TestValidator with descriptive titles for key assertions.
 */
export async function test_api_coupon_detail_get_adminuser_success(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate admin user
  const createAdminBody = {
    email: RandomGenerator.alphaNumeric(8) + "@example.com",
    password_hash: "password123",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: createAdminBody,
    });
  typia.assert(adminUser);

  // Step 2: Generate a valid couponId (UUID string)
  const couponId = typia.random<string & tags.Format<"uuid">>();

  // Step 3: Retrieve coupon details using authenticated admin context
  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.at(connection, {
      couponId,
    });
  typia.assert(coupon);

  // Step 4: Validate coupon properties
  TestValidator.predicate(
    "coupon code is non-empty string",
    typeof coupon.coupon_code === "string" && coupon.coupon_code.length > 0,
  );
  TestValidator.equals(
    "discount_type is either 'amount' or 'percentage'",
    coupon.discount_type === "amount" || coupon.discount_type === "percentage",
    true,
  );
  TestValidator.predicate(
    "status is a string",
    typeof coupon.status === "string" && coupon.status.length > 0,
  );
  TestValidator.predicate(
    "start_date is a valid ISO date-time string",
    typeof coupon.start_date === "string" &&
      !Number.isNaN(Date.parse(coupon.start_date)),
  );
  TestValidator.predicate(
    "end_date is a valid ISO date-time string",
    typeof coupon.end_date === "string" &&
      !Number.isNaN(Date.parse(coupon.end_date)),
  );
  // Check nullable fields
  TestValidator.predicate(
    "coupon_description is string or null",
    coupon.coupon_description === null ||
      typeof coupon.coupon_description === "string",
  );
  TestValidator.predicate(
    "max_discount_amount is number or null or undefined",
    coupon.max_discount_amount === null ||
      coupon.max_discount_amount === undefined ||
      typeof coupon.max_discount_amount === "number",
  );
  TestValidator.predicate(
    "min_order_amount is number or null or undefined",
    coupon.min_order_amount === null ||
      coupon.min_order_amount === undefined ||
      typeof coupon.min_order_amount === "number",
  );
  TestValidator.predicate(
    "usage_limit is number or null or undefined",
    coupon.usage_limit === null ||
      coupon.usage_limit === undefined ||
      typeof coupon.usage_limit === "number",
  );
  TestValidator.predicate(
    "per_customer_limit is number or null or undefined",
    coupon.per_customer_limit === null ||
      coupon.per_customer_limit === undefined ||
      typeof coupon.per_customer_limit === "number",
  );
}
