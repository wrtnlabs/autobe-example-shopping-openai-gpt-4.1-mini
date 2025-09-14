import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

export async function test_api_memberorder_payment_create_success(
  connection: api.IConnection,
) {
  // Step 1: Register new member user via join API
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: `user${RandomGenerator.alphaNumeric(5)}@example.com`,
        password_hash: "hashedpassword123",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // Step 2: Create a new order for the member user
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: Math.floor(Math.random() * 10000) + 1000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);
  TestValidator.equals(
    "member user id matches on order",
    order.shopping_mall_memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "order status is pending",
    order.order_status,
    "pending",
  );

  // Step 3: Create a new payment for the created order
  const paymentCreateBody = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: order.total_price,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;

  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.memberUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreateBody,
      },
    );
  typia.assert(payment);

  TestValidator.equals(
    "payment is linked to the correct order",
    payment.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "payment method matches",
    payment.payment_method,
    paymentCreateBody.payment_method,
  );
  TestValidator.equals(
    "payment status is pending",
    payment.payment_status,
    "pending",
  );
  TestValidator.equals(
    "payment amount matches order total",
    payment.payment_amount,
    order.total_price,
  );
  TestValidator.equals("transaction id is null", payment.transaction_id, null);
}
