import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

export async function test_api_coupon_index_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Valid coupon search criteria
  const validRequest = {
    coupon_code: "DISCOUNT",
    coupon_name: "Discount",
    status: "active",
    start_date_from: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 30,
    ).toISOString(),
    end_date_to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    page: 1,
    limit: 10,
    order_by: "-created_at",
  } satisfies IShoppingMallCoupon.IRequest;
  const result: IPageIShoppingMallCoupon.ISummary =
    await api.functional.shoppingMall.adminUser.coupons.index(connection, {
      body: validRequest,
    });
  typia.assert(result);

  // 3. Validate pagination info
  TestValidator.predicate(
    "pagination current page is 1",
    result.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 10",
    result.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination pages >= 0",
    result.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records >= 0",
    result.pagination.records >= 0,
  );

  // 4. Validate coupon summaries matching filter
  for (const coupon of result.data) {
    TestValidator.predicate(
      "coupon code contains 'DISCOUNT'",
      coupon.coupon_code.includes("DISCOUNT"),
    );
    TestValidator.predicate(
      "coupon name contains 'Discount'",
      coupon.coupon_name.includes("Discount"),
    );
    TestValidator.equals("coupon status is active", coupon.status, "active");
  }

  // 5. Validate sorting by created_at descending
  for (let i = 1; i < result.data.length; ++i) {
    TestValidator.predicate(
      "coupons sorted by created_at descending",
      result.data[i - 1].created_at >= result.data[i].created_at,
    );
  }

  // 6. Test empty result with unmatched filter
  const emptyRequest = {
    coupon_code: "NO_MATCH_CODE",
    coupon_name: "NoMatchName",
    status: "inactive",
    start_date_from: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 365,
    ).toISOString(),
    end_date_to: new Date().toISOString(),
    page: 1,
    limit: 5,
    order_by: "+created_at",
  } satisfies IShoppingMallCoupon.IRequest;
  const emptyResult: IPageIShoppingMallCoupon.ISummary =
    await api.functional.shoppingMall.adminUser.coupons.index(connection, {
      body: emptyRequest,
    });
  typia.assert(emptyResult);
  TestValidator.equals("empty result data count", emptyResult.data.length, 0);
}
