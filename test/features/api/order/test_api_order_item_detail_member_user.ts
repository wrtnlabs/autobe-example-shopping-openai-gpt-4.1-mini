import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test retrieving detailed order item information for a member user. The
 * sequence is:
 *
 * 1. Create member user account.
 * 2. Login member user.
 * 3. Create an order with that member user.
 * 4. Add an order item to the order.
 * 5. Retrieve and validate the order item detail.
 * 6. Test unauthorized access error.
 */
export async function test_api_order_item_detail_member_user(
  connection: api.IConnection,
) {
  // 1. Create member user account
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "plaintext_password",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: createBody,
  });
  typia.assert(memberUser);

  // 2. Login member user
  const loginBody = {
    email: createBody.email,
    password: "plaintext_password",
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberUser2 = await api.functional.auth.memberUser.login(connection, {
    body: loginBody,
  });
  typia.assert(memberUser2);

  // 3. Create order
  const createOrderBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: typia.random<number & tags.Minimum<1>>(),
  } satisfies IShoppingMallOrder.ICreate;
  const order = await api.functional.shoppingMall.memberUser.orders.createOrder(
    connection,
    { body: createOrderBody },
  );
  typia.assert(order);

  // 4. Add order item
  const createOrderItemBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<100>
    >(),
    price: typia.random<number & tags.Minimum<1>>(),
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;
  const orderItem =
    await api.functional.shoppingMall.memberUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: createOrderItemBody,
      },
    );
  typia.assert(orderItem);

  // 5. Retrieve order item detail
  const retrievedOrderItem =
    await api.functional.shoppingMall.memberUser.orders.items.at(connection, {
      orderId: order.id,
      orderItemId: orderItem.id,
    });
  typia.assert(retrievedOrderItem);

  TestValidator.equals(
    "retrieved order item ID matches created",
    retrievedOrderItem.id,
    orderItem.id,
  );
  TestValidator.equals(
    "retrieved order item order ID matches created",
    retrievedOrderItem.shopping_mall_order_id,
    orderItem.shopping_mall_order_id,
  );
  TestValidator.equals(
    "retrieved order item sale snapshot ID matches created",
    retrievedOrderItem.shopping_mall_sale_snapshot_id,
    orderItem.shopping_mall_sale_snapshot_id,
  );
  TestValidator.equals(
    "retrieved order item quantity matches created",
    retrievedOrderItem.quantity,
    orderItem.quantity,
  );
  TestValidator.equals(
    "retrieved order item price matches created",
    retrievedOrderItem.price,
    orderItem.price,
  );
  TestValidator.equals(
    "retrieved order item status matches created",
    retrievedOrderItem.order_item_status,
    orderItem.order_item_status,
  );

  // 6. Unauthorized access error test
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized access should fail", async () => {
    await api.functional.shoppingMall.memberUser.orders.items.at(unauthConn, {
      orderId: order.id,
      orderItemId: orderItem.id,
    });
  });
}
