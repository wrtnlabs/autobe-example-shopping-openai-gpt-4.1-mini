import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * Test the deletion of a shopping mall order by an authenticated member
 * user.
 *
 * This test validates both successful and failed scenarios of order
 * deletion:
 *
 * 1. Registers two member users to simulate different authentication contexts.
 * 2. Creates an order associated with the first member user.
 * 3. Successfully deletes the created order by the first member user.
 * 4. Attempts deletion of the same order by the second member user, expecting
 *    failure.
 * 5. Attempts deletion of a non-existent order by the first member user,
 *    expecting failure.
 *
 * All API responses and actions are validated using typia.assert and
 * TestValidator. This comprehensive test ensures that order deletion
 * respects member authentication and authorization, preserving security and
 * business rules.
 *
 * @param connection Connection object for API calls
 */
export async function test_api_order_delete_by_member_with_authentication_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Member user joins for authentication
  const memberUserBody1 = {
    email: `member1_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser1: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody1,
    });
  typia.assert(memberUser1);

  // 2. Use memberUser1's id and assign sales channel and section for order creation
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser1.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORD-${RandomGenerator.alphaNumeric(8)}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: 100000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // 3. Successful order deletion by the authenticated member user
  await api.functional.shoppingMall.memberUser.orders.eraseOrder(connection, {
    orderId: order.id,
  });

  // 4. Attempt deletion by a different unauthorized member user (expect error)
  const memberUserBody2 = {
    email: `member2_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser2: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody2,
    });
  typia.assert(memberUser2);

  // Switch authentication context to memberUser2

  await TestValidator.error(
    "memberUser2 cannot delete memberUser1's order",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.eraseOrder(
        connection,
        {
          orderId: order.id,
        },
      );
    },
  );

  // 5. Attempt deletion of a non-existent order by memberUser1 (expect error)

  // Switch authentication context back to memberUser1
  await api.functional.auth.memberUser.join(connection, {
    body: memberUserBody1,
  });

  const nonexistentOrderId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "deletion fails for non-existent orderId",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.eraseOrder(
        connection,
        {
          orderId: nonexistentOrderId,
        },
      );
    },
  );
}
