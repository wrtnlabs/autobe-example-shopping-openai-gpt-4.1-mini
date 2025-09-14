import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test retrieval of a specific order item detail for a guest user order.
 *
 * This test performs a full flow for a guest user: creating a guest user
 * session, creating an order, adding an order item, retrieving the order
 * item detail, and validating the result. It also verifies that
 * unauthorized access to the order item detail is rejected.
 *
 * Steps:
 *
 * 1. Create a guest user session using POST /auth/guestUser/join.
 * 2. Create a new order for the guest user using POST
 *    /shoppingMall/guestUser/orders.
 * 3. Create an order item for that order using POST
 *    /shoppingMall/guestUser/orders/{orderId}/items.
 * 4. Retrieve the created order item detail with GET
 *    /shoppingMall/guestUser/orders/{orderId}/items/{orderItemId}.
 * 5. Validate that retrieved order item matches the created order item.
 * 6. Attempt access without authorization token and verify failure.
 */
export async function test_api_order_item_detail_guest_user(
  connection: api.IConnection,
) {
  // 1. Create guest user session
  const guestJoinBody = {
    ip_address: "127.0.0.1",
    access_url: "https://localhost/",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const guest: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestJoinBody,
    });
  typia.assert(guest);

  // Clone connection w/o auth headers to test unauthorized access
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 2. Create an order
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.guestUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // 3. Create an order item for the order
  const orderItemCreateBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<100>
    >(),
    price: 10000,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemCreateBody,
      },
    );
  typia.assert(orderItem);

  // 4. Retrieve the order item detail using orderId and orderItemId
  const itemDetail: IShoppingMallOrderItem =
    await api.functional.shoppingMall.guestUser.orders.items.at(connection, {
      orderId: order.id,
      orderItemId: orderItem.id,
    });
  typia.assert(itemDetail);

  // Validate that the retrieved detail matches the created order item
  TestValidator.equals("order item id", itemDetail.id, orderItem.id);
  TestValidator.equals(
    "order id",
    itemDetail.shopping_mall_order_id,
    orderItem.shopping_mall_order_id,
  );
  TestValidator.equals(
    "sale snapshot id",
    itemDetail.shopping_mall_sale_snapshot_id,
    orderItem.shopping_mall_sale_snapshot_id,
  );
  TestValidator.equals("quantity", itemDetail.quantity, orderItem.quantity);
  TestValidator.equals("price", itemDetail.price, orderItem.price);
  TestValidator.equals(
    "order item status",
    itemDetail.order_item_status,
    orderItem.order_item_status,
  );

  // 5. Test unauthorized access to order item detail (expect error)
  await TestValidator.error(
    "unauthorized access to order item detail should fail",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.items.at(
        unauthenticatedConnection,
        {
          orderId: order.id,
          orderItemId: orderItem.id,
        },
      );
    },
  );
}
