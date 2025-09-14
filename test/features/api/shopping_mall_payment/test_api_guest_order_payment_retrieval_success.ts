import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * E2E test for successful payment retrieval flow for guest user orders.
 *
 * This test covers the entire flow of guest user joining, order creation,
 * payment creation, and retrieving payment details with validation of all
 * steps.
 *
 * Steps:
 *
 * 1. Join as guest user to get guest user authenticated context.
 * 2. Create order tied to this guest user with realistic but valid data.
 * 3. Create a payment application on that order.
 * 4. Retrieve the payment by orderId and paymentId.
 * 5. Validate that all details match between creation and retrieval responses.
 */
export async function test_api_guest_order_payment_retrieval_success(
  connection: api.IConnection,
) {
  // Step 1: Guest user join
  const guestJoinBody = {
    ip_address: "127.0.0.1",
    access_url: "https://example.com/shop",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;
  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestJoinBody,
    });
  typia.assert(guestUser);

  // Step 2: Create order
  const orderCreateBody = {
    shopping_mall_memberuser_id: guestUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: 100000,
  } satisfies IShoppingMallOrder.ICreate;
  const order = await api.functional.shoppingMall.guestUser.orders.createOrder(
    connection,
    {
      body: orderCreateBody,
    },
  );
  typia.assert(order);

  // Step 3: Create payment
  const paymentCreateBody = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: orderCreateBody.total_price,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;

  const payment =
    await api.functional.shoppingMall.guestUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreateBody,
      },
    );
  typia.assert(payment);

  // Step 4: Retrieve payment
  const fetchedPayment =
    await api.functional.shoppingMall.guestUser.orders.payments.at(connection, {
      orderId: order.id,
      paymentId: payment.id,
    });
  typia.assert(fetchedPayment);

  // Step 5: Validate matching fields
  TestValidator.equals("payment id matches", fetchedPayment.id, payment.id);
  TestValidator.equals(
    "order id matches",
    fetchedPayment.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "payment method matches",
    fetchedPayment.payment_method,
    paymentCreateBody.payment_method,
  );
  TestValidator.equals(
    "payment status matches",
    fetchedPayment.payment_status,
    paymentCreateBody.payment_status,
  );
  TestValidator.equals(
    "payment amount matches",
    fetchedPayment.payment_amount,
    paymentCreateBody.payment_amount,
  );
  TestValidator.equals(
    "transaction id matches",
    fetchedPayment.transaction_id,
    null,
  );
}
