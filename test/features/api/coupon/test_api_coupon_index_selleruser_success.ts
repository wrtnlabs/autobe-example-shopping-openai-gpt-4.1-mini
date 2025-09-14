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
 * Test the successful retrieval of coupon list with filtering and
 * pagination using valid sellerUser authentication context.
 *
 * This test will do the following:
 *
 * 1. Create a seller user with all required properties using realistic data.
 * 2. Authenticate as the created seller user to have the token set in
 *    connection.
 * 3. Call the coupon listing API with filtering parameters such as
 *    coupon_code, coupon_name, status, pagination params (page, limit), and
 *    date filters.
 * 4. Validate the response structure matches IPageIShoppingMallCoupon.ISummary
 *    with proper pagination metadata and coupon list entries.
 * 5. Assert the properties of pagination and coupons are valid and consistent.
 *
 * This end-to-end test ensures the coupon listing endpoint correctly
 * handles seller user authorization, filtering, pagination, and returns
 * properly typed data.
 */
export async function test_api_coupon_index_selleruser_success(
  connection: api.IConnection,
) {
  // Step 1: Create a seller user with valid data and authenticate
  const sellerUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUserAuthorized: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserBody,
    });
  typia.assert(sellerUserAuthorized);

  // Step 2: Prepare a coupon filtering request with realistic and plausible values
  const nowISOString = new Date().toISOString();
  const startDateFrom = new Date(
    Date.now() - 15 * 24 * 3600 * 1000,
  ).toISOString(); // 15 days ago
  const endDateTo = nowISOString;

  const couponRequestBody = {
    coupon_code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    coupon_name: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 4,
      wordMax: 8,
    }),
    status: RandomGenerator.pick(["active", "expired", "scheduled"] as const),
    page: 1,
    limit: 10,
    start_date_from: startDateFrom,
    end_date_to: endDateTo,
    order_by: "created_at",
  } satisfies IShoppingMallCoupon.IRequest;

  // Step 3: Call coupon listing API with the request body
  const couponPage: IPageIShoppingMallCoupon.ISummary =
    await api.functional.shoppingMall.sellerUser.coupons.index(connection, {
      body: couponRequestBody,
    });
  typia.assert(couponPage);

  // Step 4: Validate pagination properties
  TestValidator.predicate(
    "pagination current page must be positive integer",
    Number.isInteger(couponPage.pagination.current) &&
      couponPage.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit must be positive integer",
    Number.isInteger(couponPage.pagination.limit) &&
      couponPage.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination records must be integer >= 0",
    Number.isInteger(couponPage.pagination.records) &&
      couponPage.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages must be integer >= 0",
    Number.isInteger(couponPage.pagination.pages) &&
      couponPage.pagination.pages >= 0,
  );

  // Step 5: Validate coupon list contents
  TestValidator.predicate(
    "coupon list is array",
    Array.isArray(couponPage.data),
  );

  for (const coupon of couponPage.data) {
    typia.assert(coupon);
    TestValidator.predicate(
      "coupon id is UUID format",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        coupon.id,
      ),
    );
    TestValidator.predicate(
      "coupon code is defined",
      typeof coupon.coupon_code === "string" && coupon.coupon_code.length > 0,
    );
    TestValidator.predicate(
      "coupon name is defined",
      typeof coupon.coupon_name === "string" && coupon.coupon_name.length > 0,
    );
    TestValidator.predicate(
      "discount type is string",
      typeof coupon.discount_type === "string",
    );
    TestValidator.predicate(
      "discount value is number",
      typeof coupon.discount_value === "number",
    );
    TestValidator.predicate(
      "status is string",
      typeof coupon.status === "string",
    );
    TestValidator.predicate(
      "created at is date-time string",
      typeof coupon.created_at === "string" &&
        !isNaN(Date.parse(coupon.created_at)),
    );
  }
}
