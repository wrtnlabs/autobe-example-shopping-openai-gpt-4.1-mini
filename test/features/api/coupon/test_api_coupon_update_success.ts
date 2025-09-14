import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

/**
 * Test successful update of an existing coupon by an admin user.
 *
 * This test verifies the full workflow of administrative coupon update
 * including:
 *
 * 1. Admin user registration and authentication
 * 2. Creation of a new coupon as a prerequisite
 * 3. Updating the created coupon with valid new information
 * 4. Ensuring the update response reflects the modified fields accurately
 * 5. Confirming business rules compliance before and after update
 *
 * The test ensures that only authorized admin users can perform coupon updates
 * and that the returned updated coupon matches expected values.
 *
 * Business context: Coupons affect sales promotion and must be managed strictly
 * by admins. Updating coupons entails careful validation and consistency.
 */
export async function test_api_coupon_update_success(
  connection: api.IConnection,
) {
  // Step 1. Admin user creation and authentication
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(20);
  const adminUserCreateBody = {
    email: adminUserEmail,
    password_hash: adminUserPasswordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // Step 2. Create a coupon as a prerequisite
  const nowISOString = new Date().toISOString();
  const futureISOString = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 30,
  ).toISOString();
  // create coupon with realistic random data
  const createCouponBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    coupon_code: RandomGenerator.alphaNumeric(10),
    coupon_name: RandomGenerator.name(3),
    coupon_description: RandomGenerator.paragraph({ sentences: 5 }),
    discount_type: RandomGenerator.pick(["amount", "percentage"] as const),
    discount_value: 10,
    max_discount_amount: 1000,
    min_order_amount: 5000,
    usage_limit: 100,
    per_customer_limit: 1,
    start_date: nowISOString,
    end_date: futureISOString,
    status: "active",
  } satisfies IShoppingMallCoupon.ICreate;

  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.createCoupon(
      connection,
      {
        body: createCouponBody,
      },
    );
  typia.assert(coupon);

  // Step 3. Prepare update data for coupon
  const updateCouponBody = {
    coupon_name: RandomGenerator.name(4),
    coupon_description: RandomGenerator.paragraph({ sentences: 8 }),
    discount_type: coupon.discount_type === "amount" ? "percentage" : "amount",
    discount_value: 20,
    max_discount_amount: 2000,
    min_order_amount: 10000,
    usage_limit: 200,
    per_customer_limit: 2,
    start_date: nowISOString,
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    status: "active",
    shopping_mall_channel_id: coupon.shopping_mall_channel_id,
    coupon_code: coupon.coupon_code,
  } satisfies IShoppingMallCoupon.IUpdate;

  // Step 4. Update the coupon
  const updatedCoupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.updateCoupon(
      connection,
      {
        couponId: coupon.coupon_code,
        body: updateCouponBody,
      },
    );
  typia.assert(updatedCoupon);

  // Step 5. Validate that the updated coupon includes modified fields
  TestValidator.equals(
    "coupon channel id should not change",
    coupon.shopping_mall_channel_id,
    updatedCoupon.shopping_mall_channel_id,
  );
  TestValidator.equals(
    "coupon code should not change",
    coupon.coupon_code,
    updatedCoupon.coupon_code,
  );
  TestValidator.equals(
    "coupon name updated",
    updateCouponBody.coupon_name!,
    updatedCoupon.coupon_name,
  );
  TestValidator.equals(
    "coupon description updated",
    updateCouponBody.coupon_description!,
    updatedCoupon.coupon_description,
  );
  TestValidator.equals(
    "discount type updated",
    updateCouponBody.discount_type!,
    updatedCoupon.discount_type,
  );
  TestValidator.equals(
    "discount value updated",
    updateCouponBody.discount_value!,
    updatedCoupon.discount_value,
  );
  TestValidator.equals(
    "max discount amount updated",
    updateCouponBody.max_discount_amount!,
    updatedCoupon.max_discount_amount,
  );
  TestValidator.equals(
    "min order amount updated",
    updateCouponBody.min_order_amount!,
    updatedCoupon.min_order_amount,
  );
  TestValidator.equals(
    "usage limit updated",
    updateCouponBody.usage_limit!,
    updatedCoupon.usage_limit,
  );
  TestValidator.equals(
    "per customer limit updated",
    updateCouponBody.per_customer_limit!,
    updatedCoupon.per_customer_limit,
  );
  TestValidator.equals(
    "start date updated",
    updateCouponBody.start_date!,
    updatedCoupon.start_date,
  );
  TestValidator.equals(
    "end date updated",
    updateCouponBody.end_date!,
    updatedCoupon.end_date,
  );
  TestValidator.equals(
    "status updated",
    updateCouponBody.status!,
    updatedCoupon.status,
  );
}
