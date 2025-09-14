import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This end-to-end test validates the process of a new seller user joining
 * and authenticating, followed by querying their assigned coupons with
 * pagination and filtering options.
 *
 * Steps:
 *
 * 1. Seller user joins by providing a valid creation payload including email,
 *    password, nickname, full name, optional phone number, and business
 *    registration number.
 * 2. Successful join returns authorized seller user data and authentication
 *    tokens.
 * 3. Assert that the authorized seller user response matches expected types
 *    and values.
 * 4. Query coupons with a filtered and paginated request body, ensuring it
 *    matches the IShoppingMallCoupon.IRequest definition.
 * 5. Assert that the paginated coupon list response conforms exactly to the
 *    expected IPageIShoppingMallCoupon.ISummary structure.
 * 6. Verify key pagination fields and coupon summary properties for
 *    correctness.
 */
export async function test_api_coupon_query_selleruser_join_and_access(
  connection: api.IConnection,
) {
  // Step 1: Seller user joins with a realistic payload
  const sellerUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedSellerUser = await api.functional.auth.sellerUser.join(
    connection,
    {
      body: sellerUserCreate,
    },
  );
  typia.assert(authorizedSellerUser);

  // Step 2: Query coupons with pagination and filters
  const couponQueryRequest = {
    coupon_code: null,
    coupon_name: null,
    status: null,
    page: 1,
    limit: 10,
    start_date_from: null,
    end_date_to: null,
    order_by: null,
  } satisfies IShoppingMallCoupon.IRequest;

  const couponPage = await api.functional.shoppingMall.sellerUser.coupons.index(
    connection,
    {
      body: couponQueryRequest,
    },
  );
  typia.assert(couponPage);

  // Step 3: Validate pagination fields
  TestValidator.predicate(
    "pagination current page is 1",
    couponPage.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 10",
    couponPage.pagination.limit === 10,
  );
  TestValidator.predicate(
    "page records is non-negative",
    couponPage.pagination.records >= 0,
  );
  TestValidator.predicate(
    "page pages is positive",
    couponPage.pagination.pages >= 1,
  );

  // Step 4: Validate coupon summaries
  for (const coupon of couponPage.data) {
    typia.assert(coupon);
    TestValidator.predicate(
      `coupon id is UUID (${coupon.id})`,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        coupon.id,
      ),
    );
    TestValidator.predicate(
      `coupon code is string (${coupon.coupon_code})`,
      typeof coupon.coupon_code === "string",
    );
    TestValidator.predicate(
      `coupon name is string (${coupon.coupon_name})`,
      typeof coupon.coupon_name === "string",
    );
    TestValidator.predicate(
      `discount type is string (${coupon.discount_type})`,
      typeof coupon.discount_type === "string",
    );
    TestValidator.predicate(
      `discount value is number (${coupon.discount_value})`,
      typeof coupon.discount_value === "number",
    );
    TestValidator.predicate(
      `coupon status is string (${coupon.status})`,
      typeof coupon.status === "string",
    );
    TestValidator.predicate(
      `created at is ISO string (${coupon.created_at})`,
      !isNaN(Date.parse(coupon.created_at)),
    );
  }
}
