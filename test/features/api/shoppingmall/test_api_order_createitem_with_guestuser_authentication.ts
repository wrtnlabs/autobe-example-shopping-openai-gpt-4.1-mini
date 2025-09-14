import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

export async function test_api_order_createitem_with_guestuser_authentication(
  connection: api.IConnection,
) {
  // 1. Perform guest user join to obtain authorization token and guest user information
  const guestJoinBody = {
    ip_address: "127.0.0.1",
    access_url: "https://test.shoppingmall.com/entry",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestJoinBody,
    });
  typia.assert(guestUser);

  // 2. Use the guestUser id as the orderId placeholder (due to no explicit order creation API)
  const orderId: string = guestUser.id;

  // 3. Prepare order item create body
  const orderItemCreateBody = {
    shopping_mall_order_id: orderId,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: 1,
    price: 10000,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  // 4. Create new order item under the guest user's order
  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.create(
      connection,
      {
        orderId: orderId,
        body: orderItemCreateBody,
      },
    );
  typia.assert(orderItem);

  // 5. Validate that the response order item has expected properties
  TestValidator.equals(
    "order item shopping_mall_order_id matches orderId",
    orderItem.shopping_mall_order_id,
    orderId,
  );
  TestValidator.equals("order item quantity is 1", orderItem.quantity, 1);
  TestValidator.equals("order item price is 10000", orderItem.price, 10000);
  TestValidator.equals(
    "order item status is pending",
    orderItem.order_item_status,
    "pending",
  );
}
