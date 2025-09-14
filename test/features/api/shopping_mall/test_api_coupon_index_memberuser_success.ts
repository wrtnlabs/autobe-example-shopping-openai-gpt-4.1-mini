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
 * Test member user successful retrieval of coupons after joining
 * authentication.
 *
 * This test validates that a member user can authenticate using the join
 * operation and subsequently retrieve a paginated, filtered list of coupons
 * from the /shoppingMall/memberUser/coupons endpoint.
 *
 * The process includes:
 *
 * 1. Member user registration via join to obtain an authenticated context.
 * 2. Constructing a valid coupon request with filters such as coupon code,
 *    coupon name, status, date range, and pagination parameters.
 * 3. Calling the coupons index endpoint to fetch paginated coupon summaries.
 * 4. Validating the pagination structure and coupon list correctness including
 *    format and data types.
 */
export async function test_api_coupon_index_memberuser_success(
  connection: api.IConnection,
) {
  // 1. Member user registration to authenticate and obtain a token.
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(8),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Prepare coupon request with realistic filters and pagination.
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

  // 3. Fetch paginated coupon list
  const pageResult: IPageIShoppingMallCoupon.ISummary =
    await api.functional.shoppingMall.memberUser.coupons.index(connection, {
      body: couponRequest,
    });
  typia.assert(pageResult);

  // 4. Validate pagination info
  TestValidator.predicate(
    "pagination current is positive",
    pageResult.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    pageResult.pagination.limit >= 0,
  );
  TestValidator.predicate(
    "pagination records are non-negative",
    pageResult.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages are non-negative",
    pageResult.pagination.pages >= 0,
  );

  // 5. Validate coupon data array
  TestValidator.predicate("data is array", Array.isArray(pageResult.data));

  // 6. Validate each coupon summary fields
  for (const coupon of pageResult.data) {
    typia.assert(coupon);
    TestValidator.predicate(
      "coupon id is non-empty string",
      typeof coupon.id === "string" && coupon.id.length > 0,
    );
    TestValidator.predicate(
      "coupon code is non-empty string",
      typeof coupon.coupon_code === "string" && coupon.coupon_code.length > 0,
    );
    TestValidator.predicate(
      "coupon name is non-empty string",
      typeof coupon.coupon_name === "string" && coupon.coupon_name.length > 0,
    );
    TestValidator.predicate(
      "discount type is non-empty string",
      typeof coupon.discount_type === "string" &&
        coupon.discount_type.length > 0,
    );
    TestValidator.predicate(
      "discount value is a number",
      typeof coupon.discount_value === "number",
    );
    TestValidator.predicate(
      "status is non-empty string",
      typeof coupon.status === "string" && coupon.status.length > 0,
    );
    TestValidator.predicate(
      "created_at is string",
      typeof coupon.created_at === "string" && coupon.created_at.length > 0,
    );
  }
}
