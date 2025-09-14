import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

export async function test_api_order_update_order_item_member_user_success(
  connection: api.IConnection,
) {
  // 1. Member user creation and authentication
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Create an order for this member user
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12).toUpperCase(),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderCreateBody },
    );
  typia.assert(createdOrder);

  // 3. Update an order item within the created order
  const updateOrderItemBody = {
    shopping_mall_order_id: createdOrder.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<100>
    >(),
    price: 9999,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.IUpdate;

  const updatedOrderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.memberUser.orders.items.update(
      connection,
      {
        orderId: createdOrder.id,
        orderItemId: typia.random<string & tags.Format<"uuid">>(),
        body: updateOrderItemBody,
      },
    );
  typia.assert(updatedOrderItem);

  TestValidator.equals(
    "updated order item's order id matches",
    updatedOrderItem.shopping_mall_order_id,
    createdOrder.id,
  );
  TestValidator.equals(
    "updated order item's quantity matches",
    updatedOrderItem.quantity,
    updateOrderItemBody.quantity ?? updatedOrderItem.quantity,
  );
  TestValidator.equals(
    "updated order item's price matches",
    updatedOrderItem.price,
    updateOrderItemBody.price ?? updatedOrderItem.price,
  );
  TestValidator.equals(
    "updated order item's sale snapshot matches",
    updatedOrderItem.shopping_mall_sale_snapshot_id,
    updateOrderItemBody.shopping_mall_sale_snapshot_id ??
      updatedOrderItem.shopping_mall_sale_snapshot_id,
  );
  TestValidator.equals(
    "updated order item's status matches",
    updatedOrderItem.order_item_status,
    updateOrderItemBody.order_item_status ?? updatedOrderItem.order_item_status,
  );
}
