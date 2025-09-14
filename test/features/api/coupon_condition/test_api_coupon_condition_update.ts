import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import type { IShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponCondition";

export async function test_api_coupon_condition_update(
  connection: api.IConnection,
) {
  // 1. Admin user creation for authentication
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = "hashedpassword";
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name();

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: "active",
      },
    });
  typia.assert(adminUser);

  // 2. Create a coupon
  const couponBody: IShoppingMallCoupon.ICreate = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    coupon_code: RandomGenerator.alphaNumeric(10),
    coupon_name: RandomGenerator.paragraph({ sentences: 3 }),
    coupon_description: RandomGenerator.paragraph({ sentences: 5 }),
    discount_type: "amount",
    discount_value: 1000,
    max_discount_amount: 5000,
    min_order_amount: 3000,
    usage_limit: 100,
    per_customer_limit: 2,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: "active",
  };
  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.createCoupon(
      connection,
      {
        body: couponBody,
      },
    );
  typia.assert(coupon);

  // 3. Simulate coupon condition ID
  const conditionId = typia.random<string & tags.Format<"uuid">>();

  // 4. Update coupon condition with valid update data
  const updateBody: IShoppingMallCouponCondition.IUpdate = {
    condition_type: "include",
    shopping_mall_coupon_id: coupon.shopping_mall_channel_id,
    product_id: typia.random<string & tags.Format<"uuid">>(),
    section_id: null,
    category_id: null,
  };

  const updatedCondition: IShoppingMallCouponCondition =
    await api.functional.shoppingMall.adminUser.coupons.conditions.updateCouponCondition(
      connection,
      {
        couponId: coupon.shopping_mall_channel_id,
        conditionId: conditionId,
        body: updateBody,
      },
    );
  typia.assert(updatedCondition);

  TestValidator.equals(
    "Updated condition condition_type",
    updatedCondition.condition_type,
    updateBody.condition_type,
  );
  TestValidator.equals(
    "Updated productId matches",
    updatedCondition.product_id,
    updateBody.product_id,
  );
  TestValidator.equals(
    "Updated couponId matches",
    updatedCondition.shopping_mall_coupon_id,
    updateBody.shopping_mall_coupon_id,
  );

  // 5. Validation: invalid UUID formats for couponId and conditionId
  await TestValidator.error(
    "Invalid couponId UUID triggers error",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.updateCouponCondition(
        connection,
        {
          couponId: "invalid-uuid",
          conditionId: conditionId,
          body: updateBody,
        },
      );
    },
  );

  await TestValidator.error(
    "Invalid conditionId UUID triggers error",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.updateCouponCondition(
        connection,
        {
          couponId: coupon.shopping_mall_channel_id,
          conditionId: "invalid-uuid",
          body: updateBody,
        },
      );
    },
  );

  // 6. Negative test: unauthorized user attempts to update
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "Unauthorized user cannot update coupon condition",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.updateCouponCondition(
        unauthConn,
        {
          couponId: coupon.shopping_mall_channel_id,
          conditionId: conditionId,
          body: updateBody,
        },
      );
    },
  );

  // 7. Business rule: duplicate condition rejection
  await TestValidator.error(
    "Duplicate condition update is rejected",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.updateCouponCondition(
        connection,
        {
          couponId: coupon.shopping_mall_channel_id,
          conditionId: conditionId,
          body: updateBody,
        },
      );
    },
  );
}
