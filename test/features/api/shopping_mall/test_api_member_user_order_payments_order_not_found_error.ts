import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * Test error scenario where a member user attempts to retrieve payment
 * applications list for an invalid or non-existent order ID.
 *
 * This test first creates and authenticates a member user using the join
 * endpoint. Afterwards, it attempts to retrieve the payments list for a
 * randomly generated non-existent order ID, expecting the operation to fail
 * and throw an error (e.g., a resource not found error).
 *
 * Steps:
 *
 * 1. Create and authenticate member user
 * 2. Attempt to retrieve payments list for non-existent orderId
 * 3. Confirm that an error is thrown
 */
export async function test_api_member_user_order_payments_order_not_found_error(
  connection: api.IConnection,
) {
  // 1. Create a new member user and authenticate
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: "valid_password_hash",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Attempt to get payments for a non-existent orderId
  const invalidOrderId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "payments retrieval for non-existent orderId should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.payments.index(
        connection,
        {
          orderId: invalidOrderId,
          body: {},
        },
      );
    },
  );
}
