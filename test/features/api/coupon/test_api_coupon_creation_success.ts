import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";

/**
 * Test successful creation of a new coupon by an admin user.
 *
 * Authenticate as admin user by joining first. Create a new coupon with
 * realistic, valid data keeping all required properties. Validate response
 * properties match submitted data and include expected additional fields. This
 * covers authorization, coupon creation and response validation.
 */
export async function test_api_coupon_creation_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash: string = RandomGenerator.alphaNumeric(32);
  const adminUserCreate: IShoppingMallAdminUser.ICreate = {
    email: adminUserEmail,
    password_hash: adminUserPasswordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  };
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(adminUser);
  TestValidator.equals(
    "admin user email matches",
    adminUser.email,
    adminUserCreate.email,
  );
  TestValidator.equals(
    "admin user status equals active",
    adminUser.status,
    "active",
  );

  // 2. Create a new coupon by the authenticated admin user
  // Use current date and one month later for validity
  const startDate: string = new Date().toISOString();
  const endDate: string = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Prepare coupon create data satisfying exact required fields
  const couponCreate: IShoppingMallCoupon.ICreate = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    coupon_code: RandomGenerator.alphaNumeric(10).toUpperCase(), // typical code uppercase
    coupon_name: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
    discount_type: "amount",
    discount_value: 1000,
    max_discount_amount: null,
    min_order_amount: null,
    usage_limit: null,
    per_customer_limit: null,
    start_date: startDate,
    end_date: endDate,
    status: "active",
  };

  const coupon: IShoppingMallCoupon =
    await api.functional.shoppingMall.adminUser.coupons.createCoupon(
      connection,
      {
        body: couponCreate,
      },
    );
  typia.assert(coupon);

  // 3. Validate the created coupon fields
  TestValidator.equals(
    "coupon shopping_mall_channel_id equals",
    coupon.shopping_mall_channel_id,
    couponCreate.shopping_mall_channel_id,
  );
  TestValidator.equals(
    "coupon code equals",
    coupon.coupon_code,
    couponCreate.coupon_code,
  );
  TestValidator.equals(
    "coupon name equals",
    coupon.coupon_name,
    couponCreate.coupon_name,
  );
  TestValidator.equals(
    "coupon discount_type equals",
    coupon.discount_type,
    couponCreate.discount_type,
  );
  TestValidator.equals(
    "coupon discount_value equals",
    coupon.discount_value,
    couponCreate.discount_value,
  );
  TestValidator.equals(
    "coupon max_discount_amount equals",
    coupon.max_discount_amount,
    couponCreate.max_discount_amount,
  );
  TestValidator.equals(
    "coupon min_order_amount equals",
    coupon.min_order_amount,
    couponCreate.min_order_amount,
  );
  TestValidator.equals(
    "coupon usage_limit equals",
    coupon.usage_limit,
    couponCreate.usage_limit,
  );
  TestValidator.equals(
    "coupon per_customer_limit equals",
    coupon.per_customer_limit,
    couponCreate.per_customer_limit,
  );
  TestValidator.equals(
    "coupon start_date equals",
    coupon.start_date,
    couponCreate.start_date,
  );
  TestValidator.equals(
    "coupon end_date equals",
    coupon.end_date,
    couponCreate.end_date,
  );
  TestValidator.equals(
    "coupon status equals",
    coupon.status,
    couponCreate.status,
  );
}
