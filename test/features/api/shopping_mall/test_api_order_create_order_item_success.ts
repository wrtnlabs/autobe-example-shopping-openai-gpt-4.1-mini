import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

export async function test_api_order_create_order_item_success(
  connection: api.IConnection,
) {
  // 1. Create a new member user and authenticate
  const createUserBody = {
    email: `${RandomGenerator.alphaNumeric(10)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: createUserBody,
    });
  typia.assert(memberUser);

  // 2. Create a new order associated with the member user and random channel and section
  const channelId = typia.random<string & tags.Format<"uuid">>();
  const sectionId = typia.random<string & tags.Format<"uuid">>();
  const createOrderBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: channelId,
    shopping_mall_section_id: sectionId,
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "pending",
    total_price: (Math.floor(Math.random() * 10000) + 100) / 100,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: createOrderBody,
      },
    );
  typia.assert(order);
  TestValidator.equals(
    "order member user ID matches",
    order.shopping_mall_memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "order status is pending",
    order.order_status,
    "pending",
  );
  TestValidator.equals(
    "payment status is pending",
    order.payment_status,
    "pending",
  );

  // 3. Add a new order item to the created order
  const createOrderItemBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: 3,
    price: 99.99,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.memberUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: createOrderItemBody,
      },
    );
  typia.assert(orderItem);
  TestValidator.equals(
    "order item order ID matches",
    orderItem.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "order item quantity matches",
    orderItem.quantity,
    createOrderItemBody.quantity,
  );
  TestValidator.equals(
    "order item price matches",
    orderItem.price,
    createOrderItemBody.price,
  );
}
