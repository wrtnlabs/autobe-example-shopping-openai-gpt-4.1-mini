import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test the retrieval of order items list for a guest user who creates an
 * order and adds items.
 *
 * This test validates the complete guest user flow:
 *
 * 1. Guest user joins and obtains authorization tokens.
 * 2. A new order is created for the guest user.
 * 3. Multiple order items are added to the order.
 * 4. The order items list is fetched and verified to belong to the correct
 *    order.
 * 5. Pagination metadata is checked for correctness.
 * 6. Negative tests verify unauthorized access and invalid order ID.
 *
 * All API responses are validated with typia.assert, and test assertions
 * use TestValidator. Authentication contexts are managed via API join calls
 * without manual header manipulation.
 */
export async function test_api_order_items_guest_user_list(
  connection: api.IConnection,
) {
  // 1. Guest user join
  const guestJoinBody = {
    ip_address: "192.168.0.1",
    access_url: "https://shopping.example.com/home",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;
  const guestAuthorized: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestJoinBody,
    });
  typia.assert(guestAuthorized);

  // 2. Create order for guest user
  const orderCreateBody = {
    shopping_mall_memberuser_id: guestAuthorized.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "pending",
    total_price: 1000,
    shopping_mall_section_id: null,
  } satisfies IShoppingMallOrder.ICreate;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // 3. Create order items (two items)
  const orderItemData1 = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: 2,
    price: 500,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;
  const orderItem1: IShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemData1,
      },
    );
  typia.assert(orderItem1);

  const orderItemData2 = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: 1,
    price: 500,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;
  const orderItem2: IShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemData2,
      },
    );
  typia.assert(orderItem2);

  // 4. Fetch order items list
  const page: IPageIShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.indexOrderItems(
      connection,
      {
        orderId: order.id,
      },
    );
  typia.assert(page);

  // 5. Validate all items belong to the order
  TestValidator.predicate(
    "all order items belong to order",
    page.data.every((item) => item.shopping_mall_order_id === order.id),
  );

  // 6. Validate pagination info
  const pagination = page.pagination;
  TestValidator.predicate(
    "pagination current is >= 0",
    pagination.current >= 0,
  );
  TestValidator.predicate("pagination limit is > 0", pagination.limit > 0);
  TestValidator.predicate(
    "pagination records >= data length",
    pagination.records >= page.data.length,
  );
  TestValidator.predicate("pagination pages >= 1", pagination.pages >= 1);

  // 7. Validate at least 1 item returned
  TestValidator.predicate(
    "at least one order item returned",
    page.data.length >= 1,
  );

  // 8. Negative test: unauthorized access with no join authentication
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthorized access without join authentication",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.items.indexOrderItems(
        unauthConnection,
        { orderId: order.id },
      );
    },
  );

  // 9. Negative test: invalid orderId format
  await TestValidator.error("invalid orderId format should fail", async () => {
    await api.functional.shoppingMall.guestUser.orders.items.indexOrderItems(
      connection,
      { orderId: "invalid-uuid-format" },
    );
  });
}
