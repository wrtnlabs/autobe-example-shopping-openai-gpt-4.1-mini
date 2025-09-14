import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * This E2E test validates the successful order creation process for an
 * authenticated member user. It first creates a new member user via the join
 * API to establish authentication context. Then it creates an order for that
 * user with a valid payload including member user ID, channel ID, an optional
 * null section ID, a unique order code, order status, payment status, and total
 * price. It verifies the order creation response for correctness and type
 * compliance using typia.assert and business rule validations. The test ensures
 * correct linkage between the order and authenticating member user as well as
 * successful API integration with proper authorization handling.
 */
export async function test_api_order_creation_by_memberuser_success(
  connection: api.IConnection,
) {
  // 1. Create member user account and authenticate
  const joinBody = {
    email: RandomGenerator.alphaNumeric(8) + "@example.com",
    password_hash: "password123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: joinBody,
    });
  typia.assert(memberUser);

  // 2. Prepare order creation payload
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null, // explicitly null as section is optional
    order_code: `ORD-${Date.now()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: RandomGenerator.alphaNumeric(4).length * 1000 + 500, // reasonable positive price
  } satisfies IShoppingMallOrder.ICreate;

  // 3. Call order creation API
  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(createdOrder);

  // 4. Validate the created order
  TestValidator.equals(
    "order linked with created member user",
    createdOrder.shopping_mall_memberuser_id,
    memberUser.id,
  );

  TestValidator.equals(
    "shopping mall channel id matches request",
    createdOrder.shopping_mall_channel_id,
    orderCreateBody.shopping_mall_channel_id,
  );

  TestValidator.equals(
    "shopping mall section id matches request",
    createdOrder.shopping_mall_section_id,
    orderCreateBody.shopping_mall_section_id,
  );

  TestValidator.predicate(
    "valid order id should be uuid format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      createdOrder.id,
    ),
  );

  TestValidator.equals(
    "order code matches request",
    createdOrder.order_code,
    orderCreateBody.order_code,
  );

  TestValidator.equals(
    "order status should be 'pending' initially",
    createdOrder.order_status,
    "pending",
  );

  TestValidator.equals(
    "payment status should be 'pending' initially",
    createdOrder.payment_status,
    "pending",
  );

  TestValidator.predicate(
    "total price should be positive",
    createdOrder.total_price > 0,
  );
}
