import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

export async function test_api_order_delete_order_item_member_success(
  connection: api.IConnection,
) {
  // 1. Create a member user
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = "password123";

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: memberUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create an order for the member user
  const orderCode = `ORD-${RandomGenerator.alphaNumeric(6).toUpperCase()}`;
  const orderStatus = "pending";
  const paymentStatus = "pending";
  const channelId = typia.random<string & tags.Format<"uuid">>();

  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: channelId,
    shopping_mall_section_id: null,
    order_code: orderCode,
    order_status: orderStatus,
    payment_status: paymentStatus,
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderCreateBody },
    );
  typia.assert(order);
  TestValidator.equals(
    "order member user id",
    order.shopping_mall_memberuser_id,
    memberUser.id,
  );

  // 3. Add an order item to the created order
  const orderItemCreateBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: 1,
    price: 10000,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.memberUser.orders.items.create(
      connection,
      { orderId: order.id, body: orderItemCreateBody },
    );
  typia.assert(orderItem);
  TestValidator.equals(
    "order item order id",
    orderItem.shopping_mall_order_id,
    order.id,
  );

  // 4. Delete the created order item
  await api.functional.shoppingMall.memberUser.orders.items.erase(connection, {
    orderId: order.id,
    orderItemId: orderItem.id,
  });

  // Successful deletion inferred from no error thrown
}
