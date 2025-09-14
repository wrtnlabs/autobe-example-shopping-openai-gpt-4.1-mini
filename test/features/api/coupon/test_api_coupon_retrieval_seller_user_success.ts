import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_coupon_retrieval_seller_user_success(
  connection: api.IConnection,
) {
  // 1. Seller user creation and authentication (join)
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "ValidPassword123!", // realistic password
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(12).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Coupon retrieval by couponId
  // Use a valid UUID to simulate an existing couponId (random UUID used since actual coupon creation API isn't available)
  const couponId = typia.random<string & tags.Format<"uuid">>();
  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.sellerUser.coupons.at(connection, {
      couponId,
    });
  typia.assert(coupon);

  // 3. Business validation (simple checks)
  TestValidator.predicate(
    "coupon discount value should be positive",
    coupon.discount_value > 0,
  );
  TestValidator.predicate(
    "coupon discount type should be either 'amount' or 'percentage'",
    coupon.discount_type === "amount" || coupon.discount_type === "percentage",
  );
  TestValidator.predicate(
    "coupon code should be non-empty string",
    coupon.coupon_code.length > 0,
  );
  TestValidator.predicate(
    "coupon name should be non-empty string",
    coupon.coupon_name.length > 0,
  );
  TestValidator.predicate(
    "coupon status should be non-empty string",
    coupon.status.length > 0,
  );
  TestValidator.predicate(
    "coupon start_date should be ISO date-time string",
    typeof coupon.start_date === "string" && coupon.start_date.length > 0,
  );
  TestValidator.predicate(
    "coupon end_date should be ISO date-time string",
    typeof coupon.end_date === "string" && coupon.end_date.length > 0,
  );

  // Nullable or optional numerical fields validations
  if (
    coupon.max_discount_amount !== null &&
    coupon.max_discount_amount !== undefined
  ) {
    TestValidator.predicate(
      "max_discount_amount should be non-negative number if defined",
      coupon.max_discount_amount >= 0,
    );
  }
  if (
    coupon.min_order_amount !== null &&
    coupon.min_order_amount !== undefined
  ) {
    TestValidator.predicate(
      "min_order_amount should be non-negative number if defined",
      coupon.min_order_amount >= 0,
    );
  }
  if (coupon.usage_limit !== null && coupon.usage_limit !== undefined) {
    TestValidator.predicate(
      "usage_limit should be a non-negative integer if defined",
      Number.isInteger(coupon.usage_limit) && coupon.usage_limit >= 0,
    );
  }
  if (
    coupon.per_customer_limit !== null &&
    coupon.per_customer_limit !== undefined
  ) {
    TestValidator.predicate(
      "per_customer_limit should be a non-negative integer if defined",
      Number.isInteger(coupon.per_customer_limit) &&
        coupon.per_customer_limit >= 0,
    );
  }
}
