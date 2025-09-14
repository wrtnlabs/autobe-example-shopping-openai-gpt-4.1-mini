import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates the full workflow of creating a seller user,
 * authenticating, creating an order and order item, and then retrieving
 * detailed order item information. It ensures that all data conforms to the
 * strict typia DTO schemas, uses realistic business data inputs, and verifies
 * that created and retrieved order item data are consistent.
 *
 * The test covers these sequential steps:
 *
 * 1. Create a seller user with valid registration data.
 * 2. Authenticate the seller user.
 * 3. Create an order with required fields including member user, channel, optional
 *    section, order codes, and statuses.
 * 4. Create an order item linked to the order with valid quantities and pricing.
 * 5. Retrieve the detailed order item via GET endpoint.
 * 6. Assert all key fields between creation and retrieval for data integrity.
 */
export async function test_api_order_item_detail_seller_user(
  connection: api.IConnection,
) {
  // 1. Create seller user
  const email = typia.random<string & tags.Format<"email">>();
  const createBody = {
    email,
    password: "Password123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, { body: createBody });
  typia.assert(sellerUser);

  // 2. Login seller user
  const loginBody = {
    email,
    password: "Password123!",
  } satisfies IShoppingMallSellerUser.ILogin;
  const loginResult: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, { body: loginBody });
  typia.assert(loginResult);

  // 3. Create order
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORD-${RandomGenerator.alphaNumeric(8).toUpperCase()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: Math.floor(1000 + Math.random() * 9000),
  } satisfies IShoppingMallOrder.ICreate;

  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.sellerUser.orders.createOrder(
      connection,
      { body: orderCreateBody },
    );
  typia.assert(createdOrder);

  // 4. Create order item
  const orderItemCreateBody = {
    shopping_mall_order_id: createdOrder.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
    quantity: Math.floor(1 + Math.random() * 9),
    price: Math.floor(1000 + Math.random() * 49000),
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  const createdOrderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.sellerUser.orders.items.create(
      connection,
      { orderId: createdOrder.id, body: orderItemCreateBody },
    );
  typia.assert(createdOrderItem);

  // 5. Retrieve detailed order item
  const retrievedOrderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.sellerUser.orders.items.at(connection, {
      orderId: createdOrder.id,
      orderItemId: createdOrderItem.id,
    });
  typia.assert(retrievedOrderItem);

  // 6. Validate retrieved data matches created
  TestValidator.equals(
    "order item IDs match",
    retrievedOrderItem.id,
    createdOrderItem.id,
  );
  TestValidator.equals(
    "order IDs match",
    retrievedOrderItem.shopping_mall_order_id,
    createdOrder.id,
  );
  TestValidator.equals(
    "sale snapshot IDs match",
    retrievedOrderItem.shopping_mall_sale_snapshot_id,
    orderItemCreateBody.shopping_mall_sale_snapshot_id,
  );
  TestValidator.equals(
    "quantity matches",
    retrievedOrderItem.quantity,
    orderItemCreateBody.quantity,
  );
  TestValidator.equals(
    "price matches",
    retrievedOrderItem.price,
    orderItemCreateBody.price,
  );
  TestValidator.equals(
    "order item statuses match",
    retrievedOrderItem.order_item_status,
    orderItemCreateBody.order_item_status,
  );
}
