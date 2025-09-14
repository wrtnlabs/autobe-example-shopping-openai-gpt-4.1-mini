import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test sellerUser role authorized retrieval of coupon details by couponId.
 *
 * This test validates the workflow of a sellerUser joining (creating and
 * authenticating a new seller user) and then successfully retrieving the
 * coupon details for a specific couponId.
 *
 * It ensures proper authentication context setup and verifies that the
 * coupon detail retrieved matches expected business rules such as valid
 * coupon code, discount type, and date ranges.
 *
 * Steps:
 *
 * 1. Perform sellerUser join with valid IShoppingMallSellerUser.ICreate data.
 * 2. Retrieve coupon detail for a realistic UUID couponId using the sellerUser
 *    role.
 * 3. Assert core and optional coupon details for correctness and business
 *    logic compliance.
 */
export async function test_api_coupon_detail_get_selleruser_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate seller user with valid data
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: sellerCreateBody,
  });
  typia.assert(sellerUser);

  // 2. Use a realistic UUID couponId to fetch coupon details
  const couponId = typia.random<string & tags.Format<"uuid">>();
  const couponDetail = await api.functional.shoppingMall.sellerUser.coupons.at(
    connection,
    { couponId },
  );
  typia.assert(couponDetail);

  // 3. Validate core coupon detail properties
  TestValidator.predicate(
    "coupon code is non-empty string",
    couponDetail.coupon_code.length > 0,
  );
  TestValidator.predicate(
    "coupon name is non-empty string",
    couponDetail.coupon_name.length > 0,
  );
  TestValidator.predicate(
    "discount type is 'amount' or 'percentage'",
    couponDetail.discount_type === "amount" ||
      couponDetail.discount_type === "percentage",
  );
  TestValidator.predicate(
    "discount value is non-negative",
    couponDetail.discount_value >= 0,
  );
  TestValidator.predicate(
    "start_date is ISO date-time",
    !!Date.parse(couponDetail.start_date),
  );
  TestValidator.predicate(
    "end_date is ISO date-time",
    !!Date.parse(couponDetail.end_date),
  );
  TestValidator.predicate(
    "end_date is after start_date",
    Date.parse(couponDetail.end_date) > Date.parse(couponDetail.start_date),
  );
  TestValidator.predicate(
    "status is non-empty string",
    couponDetail.status.length > 0,
  );

  // 4. Validate optional properties if present
  if (
    couponDetail.coupon_description !== null &&
    couponDetail.coupon_description !== undefined
  ) {
    TestValidator.predicate(
      "coupon_description is non-empty if exists",
      couponDetail.coupon_description.length > 0,
    );
  }
  if (
    couponDetail.max_discount_amount !== null &&
    couponDetail.max_discount_amount !== undefined
  ) {
    TestValidator.predicate(
      "max_discount_amount is non-negative if exists",
      couponDetail.max_discount_amount >= 0,
    );
  }
  if (
    couponDetail.min_order_amount !== null &&
    couponDetail.min_order_amount !== undefined
  ) {
    TestValidator.predicate(
      "min_order_amount is non-negative if exists",
      couponDetail.min_order_amount >= 0,
    );
  }
  if (
    couponDetail.usage_limit !== null &&
    couponDetail.usage_limit !== undefined
  ) {
    TestValidator.predicate(
      "usage_limit is an integer >=0 if exists",
      Number.isInteger(couponDetail.usage_limit) &&
        couponDetail.usage_limit >= 0,
    );
  }
  if (
    couponDetail.per_customer_limit !== null &&
    couponDetail.per_customer_limit !== undefined
  ) {
    TestValidator.predicate(
      "per_customer_limit is an integer >=0 if exists",
      Number.isInteger(couponDetail.per_customer_limit) &&
        couponDetail.per_customer_limit >= 0,
    );
  }
}
