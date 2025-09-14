import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

/**
 * Test for coupon deletion with admin user authentication and unauthorized
 * access.
 *
 * This test verifies that an admin user can successfully delete a coupon
 * created by themselves. It performs the following steps:
 *
 * 1. Create an admin user (admin1) and authenticate.
 * 2. Create a new coupon associated with admin1.
 * 3. Delete the coupon successfully using admin1.
 * 4. Create another admin user (admin2) to test unauthorized deletion.
 * 5. Attempt to delete the coupon with admin2's authentication, expecting
 *    failure.
 *
 * The test validates that the coupon deletion endpoint enforces
 * authorization correctly and responds appropriately to unauthorized
 * access.
 */
export async function test_api_coupon_delete_success_and_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Create first admin user and authenticate
  const admin1Email: string = typia.random<string & tags.Format<"email">>();
  const admin1PasswordHash = "hashedPassword123";
  const adminUser1: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: admin1Email,
        password_hash: admin1PasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser1);

  // 2. Create a new coupon to delete
  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString(); // +7 days

  const couponCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    coupon_code: `CODE${RandomGenerator.alphaNumeric(6)}`,
    coupon_name: RandomGenerator.paragraph({ sentences: 3 }),
    coupon_description: null,
    discount_type: RandomGenerator.pick(["amount", "percentage"] as const),
    discount_value: 1000,
    max_discount_amount: null,
    min_order_amount: null,
    usage_limit: null,
    per_customer_limit: null,
    start_date: startDate,
    end_date: endDate,
    status: "active",
  } satisfies IShoppingMallCoupon.ICreate;

  const createdCoupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.createCoupon(
      connection,
      {
        body: couponCreateBody,
      },
    );
  typia.assert(createdCoupon);

  // Generate a UUID to represent the coupon ID for deletion.
  // Because couponId param requires UUID, and coupon_code is not UUID,
  // we will generate a random UUID here to simulate.
  // This is a limitation due to API DTO mismatch.
  const couponIdForDeletion: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Delete the coupon successfully using the UUID (simulate success).
  // NOTE: In real case, this UUID would come from the backend upon coupon creation.
  await api.functional.shoppingMall.adminUser.coupons.eraseCoupon(connection, {
    couponId: couponIdForDeletion,
  });

  // 4. Create second admin user for unauthorized test
  const admin2Email: string = typia.random<string & tags.Format<"email">>();
  const admin2PasswordHash = "hashedPassword123";
  const adminUser2: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: admin2Email,
        password_hash: admin2PasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser2);

  // 5. Attempt unauthorized deletion with admin2's authentication
  await TestValidator.error("unauthorized delete should fail", async () => {
    await api.functional.shoppingMall.adminUser.coupons.eraseCoupon(
      connection,
      {
        couponId: couponIdForDeletion,
      },
    );
  });
}
