import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

export async function test_api_coupon_query_selleruser_unauthorized_access(
  connection: api.IConnection,
) {
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

  await TestValidator.error(
    "Unauthorized sellerUser coupon query should be rejected",
    async () => {
      await api.functional.shoppingMall.sellerUser.coupons.index(connection, {
        body: requestBody,
      });
    },
  );
}
