import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * Validate that a guest user can successfully delete their own order.
 *
 * This test performs the following steps:
 *
 * 1. Create a guest user session by calling the guestUser join API with
 *    required input.
 * 2. With the authenticated guestUser role, create a new order using valid and
 *    complete order data.
 * 3. Assert the creation response to confirm the order properties and types.
 * 4. Delete the order by its ID using the guestUser delete order API.
 * 5. Confirm that the deletion request completes without throwing errors.
 *
 * This test ensures that the guest user role has correct authorization to
 * delete their own orders and that the API functions correctly with
 * required data types and constraints.
 */
export async function test_api_order_delete_guestuser_success(
  connection: api.IConnection,
) {
  // 1. Create a guest user session to obtain authentication token
  const joinBody = {
    ip_address: "192.168.1.1",
    access_url: "https://example.com/shop",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: joinBody,
    });
  typia.assert(guestUser);

  // 2. Create a new order as the authenticated guest user
  const orderCreateBody = {
    shopping_mall_memberuser_id: guestUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(16),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // 3. Delete the created order by ID
  await api.functional.shoppingMall.guestUser.orders.eraseOrder(connection, {
    orderId: order.id,
  });
}
