import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test that unauthorized users cannot update payment of an order.
 *
 * This test function performs the following steps:
 *
 * 1. Creates and authenticates a member user who creates an order.
 * 2. Creates and authenticates a seller user (unauthorized for payment update).
 * 3. Creates and authenticates a guest user (unauthorized for payment update).
 * 4. Attempts to update the order's payment using seller and guest users,
 *    expecting failure.
 *
 * Note: Verification of payment state change post-update attempts is skipped
 * due to lack of a payment retrieval API.
 */
export async function test_api_order_payment_update_unauthorized_error(
  connection: api.IConnection,
) {
  // 1. Create and login member user
  const memberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody,
    });
  typia.assert(memberUser);

  // 2. Create an order as member user
  const orderBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "pending",
    total_price: Math.floor(Math.random() * 100000) + 100,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderBody },
    );
  typia.assert(order);

  // 3. Create and login seller user (unauthorized context)
  const sellerBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, { body: sellerBody });
  typia.assert(sellerUser);

  // 4. Create and login guest user (unauthorized context)
  const guestUserBody = {
    ip_address: "192.0.2.1",
    access_url: "https://example.com",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestUserBody,
    });
  typia.assert(guestUser);

  // Payment update attempt body
  const updatePaymentBody = {
    payment_method: "credit_card",
    payment_status: "confirmed",
    payment_amount: 12345,
    transaction_id: null,
    cancelled_at: null,
  } satisfies IShoppingMallPayment.IUpdate;

  // 5. Attempt to update payment with seller user context - expect failure
  await TestValidator.error(
    "seller user cannot update member user's payment",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.payments.update(
        connection,
        {
          orderId: order.id,
          paymentId: typia.random<string & tags.Format<"uuid">>(),
          body: updatePaymentBody,
        },
      );
    },
  );

  // 6. Attempt to update payment with guest user context - expect failure
  await TestValidator.error(
    "guest user cannot update member user's payment",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.payments.update(
        connection,
        {
          orderId: order.id,
          paymentId: typia.random<string & tags.Format<"uuid">>(),
          body: updatePaymentBody,
        },
      );
    },
  );
}
