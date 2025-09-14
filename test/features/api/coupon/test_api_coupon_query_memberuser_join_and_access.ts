import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test ensures a new member user can join the platform and
 * authenticate successfully. After authentication, the member user queries
 * discount coupons using the paginated API with filters. The response and
 * its pagination metadata are validated to ensure correct filtering and
 * retrieval functionalities.
 *
 * Steps:
 *
 * 1. Create a member user with realistic random details.
 * 2. Confirm the created member user has authorized status and a valid JWT
 *    token.
 * 3. Query coupons using the member user's authentication on the
 *    /shoppingMall/memberUser/coupons endpoint.
 * 4. Test pagination fields and coupon listing correctness, including data
 *    types.
 */
export async function test_api_coupon_query_memberuser_join_and_access(
  connection: api.IConnection,
) {
  // 1. Create a new member user and authenticate
  const memberUserCreate = {
    email: `user_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: "P@ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUser);

  // 2. Query coupons with filters and pagination
  const couponRequest = {
    coupon_code: null,
    coupon_name: null,
    status: null,
    page: 1,
    limit: 10,
    start_date_from: null,
    end_date_to: null,
    order_by: null,
  } satisfies IShoppingMallCoupon.IRequest;

  const couponResponse: IPageIShoppingMallCoupon.ISummary =
    await api.functional.shoppingMall.memberUser.coupons.index(connection, {
      body: couponRequest,
    });
  typia.assert(couponResponse);

  TestValidator.predicate(
    "Coupons pagination current page number is correct",
    couponResponse.pagination.current === 1,
  );
  TestValidator.predicate(
    "Coupons pagination limit is correct",
    couponResponse.pagination.limit === 10,
  );
  TestValidator.predicate(
    "Coupons pagination records count is non-negative",
    couponResponse.pagination.records >= 0,
  );
  TestValidator.predicate(
    "Coupons pagination total pages are positive and reasonable",
    couponResponse.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "Coupons data array is an array",
    Array.isArray(couponResponse.data),
  );
  TestValidator.predicate(
    "At most 10 coupons in the response",
    couponResponse.data.length <= 10,
  );
  if (couponResponse.data.length > 0) {
    for (const coupon of couponResponse.data) {
      typia.assert(coupon);
      TestValidator.predicate(
        `Coupon code is non-empty string: ${coupon.coupon_code}`,
        typeof coupon.coupon_code === "string" && coupon.coupon_code.length > 0,
      );
      TestValidator.predicate(
        `Coupon name is non-empty string: ${coupon.coupon_name}`,
        typeof coupon.coupon_name === "string" && coupon.coupon_name.length > 0,
      );
      TestValidator.predicate(
        `Coupon discount type is one of expected strings: ${coupon.discount_type}`,
        typeof coupon.discount_type === "string" &&
          coupon.discount_type.length > 0,
      );
      TestValidator.predicate(
        `Coupon discount value is a number: ${coupon.discount_value}`,
        typeof coupon.discount_value === "number",
      );
      TestValidator.predicate(
        `Coupon status is one of expected strings: ${coupon.status}`,
        typeof coupon.status === "string" && coupon.status.length > 0,
      );
      TestValidator.predicate(
        `Coupon created_at is valid date-time string: ${coupon.created_at}`,
        typeof coupon.created_at === "string" &&
          !isNaN(Date.parse(coupon.created_at)),
      );
    }
  }
}
