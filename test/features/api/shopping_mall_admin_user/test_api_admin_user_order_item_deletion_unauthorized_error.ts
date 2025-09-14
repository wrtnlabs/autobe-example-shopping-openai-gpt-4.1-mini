import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Validate unauthorized user’s attempt to delete an order item.
 *
 * This test verifies that an unauthenticated user (without adminUser
 * authorization) cannot delete order items. It covers:
 *
 * 1. Creating an admin user with the join endpoint to establish proper auth
 *    context.
 * 2. Attempting to delete a specific order item with an unauthenticated
 *    connection.
 * 3. Validating that the delete operation throws an authorization error as
 *    expected.
 */
export async function test_api_admin_user_order_item_deletion_unauthorized_error(
  connection: api.IConnection,
) {
  // 1. Create admin user (join) to establish adminUser authentication context
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash: string = RandomGenerator.alphaNumeric(32);

  await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPasswordHash,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });

  // 2. Use unauthenticated connection (empty headers) to simulate unauthorized access
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Generate random UUIDs for orderId and orderItemId
  const orderId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const orderItemId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Attempt to delete order item with unauthenticated connection
  // Expect an authorization error (due to insufficient permissions)
  await TestValidator.error(
    "unauthorized deletion attempt throws error",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.items.erase(
        unauthenticatedConnection,
        {
          orderId,
          orderItemId,
        },
      );
    },
  );
}
