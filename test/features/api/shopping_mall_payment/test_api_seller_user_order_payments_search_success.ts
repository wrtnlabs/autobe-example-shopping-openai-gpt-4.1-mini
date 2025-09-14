import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_seller_user_order_payments_search_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a seller user
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerUserEmail,
      password: "strongPassword123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: RandomGenerator.mobile(),
      business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerUser);

  // 2. Create an order with the authenticated seller user
  const orderRequestBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORD-${RandomGenerator.alphaNumeric(8).toUpperCase()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: Math.floor(Math.random() * 10000) + 1000,
  } satisfies IShoppingMallOrder.ICreate;

  const order = await api.functional.shoppingMall.sellerUser.orders.createOrder(
    connection,
    {
      body: orderRequestBody,
    },
  );
  typia.assert(order);

  // 3. Create multiple payments for this order
  const paymentMethods = ["credit_card", "bank_transfer"] as const;
  const paymentStatuses = ["pending", "confirmed"] as const;

  // Create 3 payments with mixed methods and statuses
  for (let i = 0; i < 3; ++i) {
    const paymentBody = {
      shopping_mall_order_id: order.id,
      payment_method: RandomGenerator.pick(paymentMethods),
      payment_status: RandomGenerator.pick(paymentStatuses),
      payment_amount: Math.floor(Math.random() * 3000) + 500,
      transaction_id: `TXN${RandomGenerator.alphaNumeric(10).toUpperCase()}`,
    } satisfies IShoppingMallPayment.ICreate;
    const payment =
      await api.functional.shoppingMall.sellerUser.orders.payments.create(
        connection,
        {
          orderId: order.id,
          body: paymentBody,
        },
      );
    typia.assert(payment);
  }

  // 4. Query payment list without filter and verify pagination
  const fullPage =
    await api.functional.shoppingMall.sellerUser.orders.payments.index(
      connection,
      {
        orderId: order.id,
        body: {
          page: 1,
          limit: 10,
        } satisfies IShoppingMallPayment.IRequest,
      },
    );
  typia.assert(fullPage);

  TestValidator.predicate(
    "pagination current page is 1",
    fullPage.pagination.current === 1,
  );

  TestValidator.predicate(
    "pagination limit is 10",
    fullPage.pagination.limit === 10,
  );

  TestValidator.predicate(
    "there is at least one payment",
    fullPage.data.length > 0,
  );

  // 5. Query payments filtered by a payment method and status
  const methodFilter = RandomGenerator.pick(paymentMethods);
  const statusFilter = RandomGenerator.pick(paymentStatuses);

  const filteredPage =
    await api.functional.shoppingMall.sellerUser.orders.payments.index(
      connection,
      {
        orderId: order.id,
        body: {
          page: 1,
          limit: 10,
          payment_method: methodFilter,
          payment_status: statusFilter,
        } satisfies IShoppingMallPayment.IRequest,
      },
    );
  typia.assert(filteredPage);

  // Verify that filtered results match the filter criteria
  filteredPage.data.forEach((payment) => {
    TestValidator.equals(
      `payment method is ${methodFilter}`,
      payment.payment_method,
      methodFilter,
    );
    TestValidator.equals(
      `payment status is ${statusFilter}`,
      payment.payment_status,
      statusFilter,
    );
  });

  // 6. Check consistency between total payments and filtered sums
  const totalAmount = fullPage.data.reduce(
    (acc, cur) => acc + cur.payment_amount,
    0,
  );
  const filteredAmount = filteredPage.data.reduce(
    (acc, cur) => acc + cur.payment_amount,
    0,
  );

  TestValidator.predicate(
    "filtered amount is less than or equal to total",
    filteredAmount <= totalAmount,
  );
}
