import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

export async function test_api_guestorder_payment_create_success(
  connection: api.IConnection,
) {
  // 1. Create guest user session via join
  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: {
        ip_address: "127.0.0.1",
        access_url: "https://example.com/",
        referrer: null,
        user_agent: null,
      } satisfies IShoppingMallGuestUser.IJoin,
    });
  typia.assert(guestUser);

  // 2. Create order for guest user
  const orderCode = RandomGenerator.alphaNumeric(12);
  const orderStatus = "pending";
  const paymentStatus = "pending";
  const totalPrice = 10000; // positive number
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: {
        shopping_mall_memberuser_id: guestUser.id,
        shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
        shopping_mall_section_id: null,
        order_code: orderCode,
        order_status: orderStatus,
        payment_status: paymentStatus,
        total_price: totalPrice,
      } satisfies IShoppingMallOrder.ICreate,
    });
  typia.assert(order);

  // 3. Create payment application for the order
  const paymentMethod = RandomGenerator.pick([
    "credit_card",
    "bank_transfer",
    "mobile_payment",
  ] as const);
  const paymentAmount = totalPrice; // Full amount

  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.guestUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: {
          shopping_mall_order_id: order.id,
          payment_method: paymentMethod,
          payment_status: "pending",
          payment_amount: paymentAmount,
          transaction_id: null,
        } satisfies IShoppingMallPayment.ICreate,
      },
    );
  typia.assert(payment);

  // Validate that the payment's order ID matches
  TestValidator.equals(
    "payment order id matches created order id",
    payment.shopping_mall_order_id,
    order.id,
  );
  // Validate payment status is exactly 'pending'
  TestValidator.equals(
    "payment status is pending",
    payment.payment_status,
    "pending",
  );
  // Validate payment amount is positive and equals total price
  TestValidator.predicate(
    "payment amount is positive and equals order total",
    payment.payment_amount === totalPrice && payment.payment_amount > 0,
  );
}
