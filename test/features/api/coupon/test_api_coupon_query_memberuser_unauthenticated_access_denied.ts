import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

/**
 * Test unauthorized access denial when querying member user coupons.
 *
 * This test verifies that unauthenticated or unauthorized users cannot
 * access the coupon list via PATCH /shoppingMall/memberUser/coupons
 * endpoint.
 *
 * Steps:
 *
 * 1. Prepare an unauthenticated connection.
 * 2. Attempt to query coupons with empty filters.
 * 3. Expect an access denied error or rejection.
 * 4. Assert that the error occurs properly.
 *
 * This test ensures the security of coupon query APIs by enforcing
 * role-based access controls.
 */
export async function test_api_coupon_query_memberuser_unauthenticated_access_denied(
  connection: api.IConnection,
) {
  // Test unauthenticated access denial
  await TestValidator.error(
    "unauthenticated user querying member coupons should be denied",
    async () => {
      await api.functional.shoppingMall.memberUser.coupons.index(connection, {
        body: {
          coupon_code: null,
          coupon_name: null,
          status: null,
          page: null,
          limit: null,
          start_date_from: null,
          end_date_to: null,
          order_by: null,
        } satisfies IShoppingMallCoupon.IRequest,
      });
    },
  );
}
