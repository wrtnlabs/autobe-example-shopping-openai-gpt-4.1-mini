import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * Test the ability of a guest user to retrieve a paginated list of payment
 * applications for a specific order. The scenario covers filtering by
 * payment method, payment status, and date ranges. The guest user
 * authentication context must be established first. The scenario will test
 * successful retrieval with valid filters and proper pagination responses.
 */
export async function test_api_guest_user_order_payments_search_success(
  connection: api.IConnection,
) {
  // 1. Guest user joins
  const guestUserJoinBody = {
    ip_address: "192.168.0.1",
    access_url: "https://shoppingmall.example.com",
    referrer: "https://google.com",
    user_agent: "Mozilla/5.0",
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestUserJoinBody,
    });
  typia.assert(guestUser);

  // 2. Create an order
  // Use required properties with realistic values
  const orderCreateBody = {
    shopping_mall_memberuser_id: guestUser.id, // Use guest user id here
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORD-${RandomGenerator.alphabets(5).toUpperCase()}-${Date.now()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: 1000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // 3. Search payments for the order with filters and pagination
  // Using realistic filters
  const nowISOString = new Date().toISOString();
  const oneDayAgoISOString = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const paymentsSearchBody = {
    page: 1,
    limit: 10,
    payment_method: null,
    payment_status: null,
    created_at_from: oneDayAgoISOString,
    created_at_to: nowISOString,
  } satisfies IShoppingMallPayment.IRequest;

  const paymentsPage: IPageIShoppingMallPayment.ISummary =
    await api.functional.shoppingMall.guestUser.orders.payments.index(
      connection,
      {
        orderId: order.id,
        body: paymentsSearchBody,
      },
    );
  typia.assert(paymentsPage);

  TestValidator.predicate(
    "pagination page is at least 1",
    paymentsPage.pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination limit is at least 1",
    paymentsPage.pagination.limit >= 1,
  );
  TestValidator.predicate(
    "pages is positive",
    paymentsPage.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "record count positive",
    paymentsPage.pagination.records >= 0,
  );

  if (paymentsPage.data.length > 0) {
    for (const payment of paymentsPage.data) {
      typia.assert(payment);
      TestValidator.predicate(
        "payment ID is UUID",
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          payment.id,
        ),
      );
      TestValidator.predicate(
        "payment amount is positive",
        payment.payment_amount >= 0,
      );
      TestValidator.predicate(
        "payment method is string",
        typeof payment.payment_method === "string" &&
          payment.payment_method.length > 0,
      );
      TestValidator.predicate(
        "payment status is string",
        typeof payment.payment_status === "string" &&
          payment.payment_status.length > 0,
      );
    }
  }
}
