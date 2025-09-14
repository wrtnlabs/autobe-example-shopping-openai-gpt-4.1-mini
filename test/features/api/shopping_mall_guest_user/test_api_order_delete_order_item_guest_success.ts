import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * E2E test for the guest user flow of creating a session, placing an order,
 * adding an order item, and deleting that order item successfully.
 *
 * This test covers the following steps:
 *
 * 1. Create guest user session (authentication and context establishment).
 * 2. Create an order under the guest user session.
 * 3. Add an order item to that order.
 * 4. Delete the added order item successfully.
 *
 * The test validates all responses and business logic, ensuring data
 * integrity, authorization, and correct API interaction sequences.
 */
export async function test_api_order_delete_order_item_guest_success(
  connection: api.IConnection,
) {
  // 1. Create guest user session
  const joinBody = {
    ip_address: "192.168.0.1",
    access_url: "https://shoppingmall.example.com",
    referrer: null,
    user_agent: "Mozilla/5.0 (compatible; TestBot/1.0)",
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, { body: joinBody });
  typia.assert(guestUser);

  // 2. Create a new order under guest user
  const orderBody = {
    shopping_mall_memberuser_id: guestUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: orderBody,
    });
  typia.assert(order);

  // 3. Add an order item to the created order
  const orderItemBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: 1,
    price: 10000,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemBody,
      },
    );
  typia.assert(orderItem);

  // 4. Delete the added order item
  await api.functional.shoppingMall.guestUser.orders.items.erase(connection, {
    orderId: order.id,
    orderItemId: orderItem.id,
  });
  // If no exception, deletion succeeded
}
