import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * Test the retrieval of payment applications list for a member user's specific
 * order, including filtering by payment method and payment status, verifying
 * pagination, and validating sorting order.
 *
 * The test follows the sequence:
 *
 * 1. Member user is created and authenticated.
 * 2. An order is created under the authenticated member user.
 * 3. Multiple payment records are added to the created order with varied methods
 *    and statuses.
 * 4. The patch endpoint for listing payments is called with filter criteria for
 *    payment method and status, pagination parameters.
 * 5. The test verifies that the payments returned match the filters, pagination is
 *    correct, and the data structure is valid.
 */
export async function test_api_member_user_order_payments_search_success(
  connection: api.IConnection,
) {
  // 1. Create member user and authenticate
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Create an order for the member user
  // create order requires member user id, and channel id, order code, status, payment status, and total_price
  // Since no information on channel/section is provided, use null for section and a random UUID for channel
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // 3. Add multiple payments to the order with different methods and statuses
  const paymentMethods = ["credit_card", "bank_transfer", "paypal"] as const;
  const paymentStatuses = ["pending", "confirmed", "cancelled"] as const;

  const payments: IShoppingMallPayment[] = [];

  // For test, create 6 payments varying methods and statuses
  for (let i = 0; i < 6; ++i) {
    const method = paymentMethods[i % paymentMethods.length];
    const status = paymentStatuses[i % paymentStatuses.length];

    const paymentCreateBody = {
      shopping_mall_order_id: order.id,
      payment_method: method,
      payment_status: status,
      payment_amount: 1000 + i * 100,
      transaction_id: RandomGenerator.alphaNumeric(16),
    } satisfies IShoppingMallPayment.ICreate;

    const payment =
      await api.functional.shoppingMall.memberUser.orders.payments.create(
        connection,
        {
          orderId: order.id,
          body: paymentCreateBody,
        },
      );
    typia.assert(payment);
    payments.push(payment);
  }

  // 4. Test listing payments with filtering, pagination and sorting

  // Test filtering by payment_method = 'credit_card' and payment_status = 'pending'
  const filterBody1 = {
    page: 1,
    limit: 3,
    payment_method: "credit_card",
    payment_status: "pending",
  } satisfies IShoppingMallPayment.IRequest;

  const response1: IPageIShoppingMallPayment.ISummary =
    await api.functional.shoppingMall.memberUser.orders.payments.index(
      connection,
      {
        orderId: order.id,
        body: filterBody1,
      },
    );

  typia.assert(response1);

  // Verify that all returned items have payment_method and payment_status that match the filters
  for (const item of response1.data) {
    TestValidator.equals(
      "payment_method filter",
      item.payment_method,
      filterBody1.payment_method,
    );
    TestValidator.equals(
      "payment_status filter",
      item.payment_status,
      filterBody1.payment_status,
    );
  }

  // Check pagination metadata
  TestValidator.predicate(
    "pagination current page is 1",
    response1.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 3",
    response1.pagination.limit === 3,
  );

  // Test filter with payment_status = 'confirmed' only, no payment_method filter
  const filterBody2 = {
    page: 1,
    limit: 10,
    payment_method: null,
    payment_status: "confirmed",
  } satisfies IShoppingMallPayment.IRequest;

  const response2: IPageIShoppingMallPayment.ISummary =
    await api.functional.shoppingMall.memberUser.orders.payments.index(
      connection,
      {
        orderId: order.id,
        body: filterBody2,
      },
    );

  typia.assert(response2);

  for (const item of response2.data) {
    TestValidator.equals(
      "payment_status filter confirmed",
      item.payment_status,
      filterBody2.payment_status,
    );
  }

  TestValidator.predicate(
    "pagination limit is 10",
    response2.pagination.limit === 10,
  );

  // Test page limit exceeding total records to verify pagination pages correctness
  const filterBody3 = {
    page: 1,
    limit: 100,
  } satisfies IShoppingMallPayment.IRequest;

  const response3: IPageIShoppingMallPayment.ISummary =
    await api.functional.shoppingMall.memberUser.orders.payments.index(
      connection,
      {
        orderId: order.id,
        body: filterBody3,
      },
    );

  typia.assert(response3);

  TestValidator.predicate(
    "pagination pages count calculated correctly",
    response3.pagination.pages >= 1 &&
      response3.pagination.records >= response3.data.length,
  );

  // Confirm returned data is sorted by created_at descending according to default behavior (assuming so)
  for (let i = 1; i < response3.data.length; ++i) {
    const prev = response3.data[i - 1].created_at;
    const curr = response3.data[i].created_at;
    TestValidator.predicate(
      `created_at descending order check for index ${i}`,
      prev >= curr,
    );
  }
}
