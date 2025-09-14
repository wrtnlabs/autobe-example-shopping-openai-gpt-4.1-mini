import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates the complete workflow for a seller user to create
 * an order and then add an order item to that order. The test begins by
 * creating a seller user through the join API ensuring proper
 * authentication context. Then it creates a new order associated with
 * member user and sales channel identifiers, providing necessary order
 * details such as order_code, order_status, payment_status, and
 * total_price. After successfully creating an order, the seller user adds
 * an order item referencing a valid sale snapshot associated with the
 * order, specifying quantity, price, and order item status. The test
 * asserts that each API response matches expected types and that the
 * returned values have the expected business logic consistency and
 * formatting. This test ensures that the seller user authorization provides
 * proper access and that the creation APIs handle the data workflow
 * correctly.
 */
export async function test_api_order_create_order_item_with_seller_auth_success(
  connection: api.IConnection,
) {
  // Step 1: Create a new seller user and authenticate
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(2),
    full_name: `${RandomGenerator.name(1)} ${RandomGenerator.name(1)}`,
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // Step 2: Create a new order as the authenticated seller user
  // Since member_user_id, channel_id, and section_id are UUIDs, we generate random UUID strings
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12).toUpperCase(),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.sellerUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // Step 3: Create a new order item under the created order
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
    await api.functional.shoppingMall.sellerUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemCreateBody,
      },
    );
  typia.assert(orderItem);

  // Validation checks
  TestValidator.equals(
    "sellerUser email matches creation input",
    sellerUser.email,
    sellerUserCreateBody.email,
  );
  TestValidator.equals(
    "order member user id matches request",
    order.shopping_mall_memberuser_id,
    orderCreateBody.shopping_mall_memberuser_id,
  );
  TestValidator.equals(
    "order item order id matches created order",
    orderItem.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals("order item quantity is 1", orderItem.quantity, 1);
  TestValidator.equals("order item price is 10000", orderItem.price, 10000);
  TestValidator.equals(
    "order item status is pending",
    orderItem.order_item_status,
    "pending",
  );
}
