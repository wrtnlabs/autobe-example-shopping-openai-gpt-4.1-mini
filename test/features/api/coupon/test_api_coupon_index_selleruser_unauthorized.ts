import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_coupon_index_selleruser_unauthorized(
  connection: api.IConnection,
) {
  // Compose a coupon listing request body with typical filters
  const requestBody = {
    coupon_code: null,
    coupon_name: null,
    status: null,
    page: 1,
    limit: 10,
    start_date_from: null,
    end_date_to: null,
    order_by: null,
  } satisfies IShoppingMallCoupon.IRequest;

  // Prepare an unauthenticated connection without any Authorization headers
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // Expect the call to fail due to unauthorized access
  await TestValidator.error("unauthorized access is forbidden", async () => {
    await api.functional.shoppingMall.sellerUser.coupons.index(unauthConn, {
      body: requestBody,
    });
  });
}
