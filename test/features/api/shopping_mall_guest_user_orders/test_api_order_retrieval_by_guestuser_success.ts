import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * Validate that a guest user can successfully retrieve detailed information
 * about a specific order after creating a temporary guest session and
 * placing an order.
 *
 * This test covers:
 *
 * - Guest user session creation with client metadata
 * - Order creation with all required fields under guest user context
 * - Retrieval of order by its ID and validation of correctness
 * - Enforcement of unauthorized access rejection when no guest credentials
 *   are present
 * - Handling of invalid order ID retrieval attempts
 */
export async function test_api_order_retrieval_by_guestuser_success(
  connection: api.IConnection,
) {
  // 1. Create a guest user session by joining as a guest user
  const joinBody = {
    ip_address: "127.0.0.1",
    access_url: "http://localhost/",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestAuthorized: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: joinBody,
    });
  typia.assert(guestAuthorized);

  // 2. Create order creation payload
  // The member user ID is required by schema but we simulate a guest user by generating a UUID
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORDER-${RandomGenerator.alphaNumeric(10)}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: 100000,
  } satisfies IShoppingMallOrder.ICreate;

  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(createdOrder);

  // 3. Retrieve the order details with the created order id
  const retrievedOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.atOrder(connection, {
      orderId: createdOrder.id,
    });
  typia.assert(retrievedOrder);

  // 4. Validate retrieved order data
  TestValidator.equals("order id matches", retrievedOrder.id, createdOrder.id);
  TestValidator.equals(
    "order code matches",
    retrievedOrder.order_code,
    createdOrder.order_code,
  );
  TestValidator.equals(
    "order status matches",
    retrievedOrder.order_status,
    createdOrder.order_status,
  );
  TestValidator.equals(
    "payment status matches",
    retrievedOrder.payment_status,
    createdOrder.payment_status,
  );
  TestValidator.equals(
    "total price matches",
    retrievedOrder.total_price,
    createdOrder.total_price,
  );
  TestValidator.equals(
    "shopping mall member user id matches",
    retrievedOrder.shopping_mall_memberuser_id,
    createdOrder.shopping_mall_memberuser_id,
  );
  TestValidator.equals(
    "shopping mall channel id matches",
    retrievedOrder.shopping_mall_channel_id,
    createdOrder.shopping_mall_channel_id,
  );
  TestValidator.equals(
    "shopping mall section id matches",
    retrievedOrder.shopping_mall_section_id,
    null,
  );

  // 5. Test unauthorized access to order detail without authorization
  // Use fresh connection without authorization headers
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized guest user cannot retrieve order",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.atOrder(
        unauthorizedConnection,
        {
          orderId: createdOrder.id,
        },
      );
    },
  );

  // 6. Test retrieval with invalid order id expecting error
  await TestValidator.error(
    "retrieval fails with invalid order id",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.atOrder(connection, {
        orderId: "00000000-0000-0000-0000-000000000000",
      });
    },
  );
}
