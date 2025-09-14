import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

export async function test_api_coupon_condition_delete(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate an admin user.
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "hashed_password1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Step 2: Create a coupon to attach conditions.
  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.createCoupon(
      connection,
      {
        body: {
          shopping_mall_channel_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          coupon_code:
            "CPN-" +
            RandomGenerator.paragraph({ sentences: 1, wordMin: 5, wordMax: 8 })
              .replace(/\s/g, "-")
              .toUpperCase(),
          coupon_name: RandomGenerator.paragraph({
            sentences: 1,
            wordMin: 5,
            wordMax: 12,
          }),
          coupon_description: RandomGenerator.content({ paragraphs: 1 }),
          discount_type: RandomGenerator.pick([
            "amount",
            "percentage",
          ] as const),
          discount_value: Math.floor(Math.random() * 100) + 1, // 1 to 100
          max_discount_amount: null,
          min_order_amount: null,
          usage_limit: null,
          per_customer_limit: null,
          start_date: new Date().toISOString(),
          end_date: new Date(
            new Date().getTime() + 86400000 * 30,
          ).toISOString(), // 30 days
          status: "active",
        } satisfies IShoppingMallCoupon.ICreate,
      },
    );
  typia.assert(coupon);

  // Because couponId is expected as a UUID and is not returned from coupon creation,
  // generate a random UUID string here to use as couponId parameter. This simulates the scenario
  // where we know the coupon UUID which identifies the coupon in the system.
  const couponId: string = typia.random<string & tags.Format<"uuid">>();

  // Step 3: Delete the coupon condition successfully.
  const conditionIdToDelete: string = typia.random<
    string & tags.Format<"uuid">
  >();

  await api.functional.shoppingMall.adminUser.coupons.conditions.eraseCouponCondition(
    connection,
    {
      couponId: couponId, // Note: using generated UUID for test compliance
      conditionId: conditionIdToDelete,
    },
  );

  // No response expected (void), no assertion needed.

  // Step 4: Negative test - attempt to delete a condition without admin authorization
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized deletion should throw", async () => {
    await api.functional.shoppingMall.adminUser.coupons.conditions.eraseCouponCondition(
      unauthenticatedConnection,
      {
        couponId: couponId,
        conditionId: typia.random<string & tags.Format<"uuid">>(),
      },
    );
  });

  // Step 5: Negative test - attempt to delete a non-existing condition
  await TestValidator.error(
    "deletion of non-existent condition should throw",
    async () => {
      await api.functional.shoppingMall.adminUser.coupons.conditions.eraseCouponCondition(
        connection,
        {
          couponId: couponId,
          conditionId: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    },
  );
}
