import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_coupon_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Member user signs up and authenticates
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "securepassword123!", // Using a fixed valid password hash string for test
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Retrieve a coupon by couponId
  const couponId: string = typia.random<string & tags.Format<"uuid">>();
  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.memberUser.coupons.at(connection, {
      couponId,
    });
  typia.assert(coupon);

  // 3. Validate coupon details align with expected fields
  TestValidator.predicate(
    "discount type is valid",
    coupon.discount_type === "amount" || coupon.discount_type === "percentage",
  );
  TestValidator.predicate(
    "discount value is non-negative",
    coupon.discount_value >= 0,
  );
  TestValidator.predicate(
    "coupon status is defined",
    typeof coupon.status === "string" && coupon.status.length > 0,
  );
  TestValidator.predicate(
    "validity period start date is valid ISO string",
    typeof coupon.start_date === "string" && coupon.start_date.length > 0,
  );
  TestValidator.predicate(
    "validity period end date is valid ISO string",
    typeof coupon.end_date === "string" && coupon.end_date.length > 0,
  );
  TestValidator.equals(
    "coupon name is non-empty",
    typeof coupon.coupon_name === "string" && coupon.coupon_name.length > 0,
    true,
  );
}
