import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_order_creation_by_selleruser_success(
  connection: api.IConnection,
) {
  // Step 1: Create a new seller user to establish authenticated context.
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerAuthorized = await api.functional.auth.sellerUser.join(
    connection,
    {
      body: sellerCreateBody,
    },
  );
  typia.assert(sellerAuthorized);

  // Step 2: Create a new order using authenticated context.
  // For the order creation, sample realistic UUIDs for member user and channel IDs.
  // The section ID is explicitly passed as null.
  // The order_code is a unique string identifier.
  // Order status and payment status are passed as "pending".
  // Total price is set realistically.

  const createOrderBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORD-${RandomGenerator.alphaNumeric(8).toUpperCase()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: Math.floor(Math.random() * 9000) + 1000, // realistic price 1000-9999
  } satisfies IShoppingMallOrder.ICreate;

  const createdOrder =
    await api.functional.shoppingMall.sellerUser.orders.createOrder(
      connection,
      { body: createOrderBody },
    );
  typia.assert(createdOrder);

  // Step 3: Validate critical order properties
  TestValidator.predicate(
    "created order has valid UUID id",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      createdOrder.id,
    ),
  );
  TestValidator.equals(
    "created order status is pending",
    createdOrder.order_status,
    "pending",
  );
  TestValidator.equals(
    "created payment status is pending",
    createdOrder.payment_status,
    "pending",
  );
  TestValidator.predicate(
    "created order total price positive",
    createdOrder.total_price > 0,
  );
}
