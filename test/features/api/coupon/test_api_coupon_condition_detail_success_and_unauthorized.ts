import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponCondition";

export async function test_api_coupon_condition_detail_success_and_unauthorized(
  connection: api.IConnection,
) {
  // 1. Admin User Creation and Authentication
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `${RandomGenerator.alphaNumeric(8)}@test.com`,
        password_hash: RandomGenerator.alphaNumeric(12),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate a couponId UUID for test usage (not returned by createCoupon API)
  const couponId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Coupon Creation (without couponId since it's not in DTO but subsequent path uses couponId)
  const couponCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    coupon_code: RandomGenerator.alphaNumeric(10).toUpperCase(),
    coupon_name: RandomGenerator.paragraph({ sentences: 3 }),
    coupon_description: RandomGenerator.content({ paragraphs: 1 }),
    discount_type: "amount",
    discount_value: 1000,
    max_discount_amount: null,
    min_order_amount: 10000,
    usage_limit: null,
    per_customer_limit: null,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    status: "active",
  } satisfies IShoppingMallCoupon.ICreate;

  const createdCoupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.createCoupon(
      connection,
      { body: couponCreateBody },
    );
  typia.assert(createdCoupon);

  // 4. Coupon Condition Creation with generated couponId
  const couponConditionCreateBody = {
    shopping_mall_coupon_id: couponId,
    condition_type: "include",
    product_id: null,
    section_id: null,
    category_id: null,
  } satisfies IShoppingMallCouponCondition.ICreate;

  const createdCondition: IShoppingMallCouponCondition =
    await api.functional.shoppingMall.adminUser.coupons.conditions.createCouponCondition(
      connection,
      {
        couponId: couponId,
        body: couponConditionCreateBody,
      },
    );
  typia.assert(createdCondition);

  // 5. Success: Retrieve the coupon condition detail with authorized admin connection
  const gotCondition: IShoppingMallCouponCondition =
    await api.functional.shoppingMall.adminUser.coupons.conditions.atCouponCondition(
      connection,
      {
        couponId: couponId,
        conditionId: createdCondition.id,
      },
    );
  typia.assert(gotCondition);
  TestValidator.equals(
    "condition id matches",
    gotCondition.id,
    createdCondition.id,
  );

  // 6. Failure: Unauthorized connection attempting to retrieve coupon condition detail
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized cannot get condition detail",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.atCouponCondition(
        unauthorizedConnection,
        {
          couponId: couponId,
          conditionId: createdCondition.id,
        },
      );
    },
  );

  // 7. Failure: Not found error with non-existent conditionId
  await TestValidator.error(
    "not found error for invalid conditionId",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.atCouponCondition(
        connection,
        {
          couponId: couponId,
          conditionId: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    },
  );
}
