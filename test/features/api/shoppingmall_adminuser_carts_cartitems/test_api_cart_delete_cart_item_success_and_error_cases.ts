import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * This E2E test verifies the functionality of deleting a cart item by an
 * authenticated admin user.
 *
 * It tests:
 *
 * 1. Creating and authenticating a new admin user.
 * 2. Successfully deleting a cart item specified by cartId and cartItemId.
 * 3. Handling errors when attempting to delete non-existent cart items.
 * 4. Handling errors when attempting deletion without proper authentication.
 *
 * This ensures that the admin cart item deletion API endpoint enforces access
 * control and correctly handles success and error scenarios.
 */
export async function test_api_cart_delete_cart_item_success_and_error_cases(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUserAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUserAuthorized);

  // 2. Generate UUIDs for cartId and cartItemId
  const cartId = typia.random<string & tags.Format<"uuid">>();
  const cartItemId = typia.random<string & tags.Format<"uuid">>();

  // 3. Delete cart item successfully
  await api.functional.shoppingMall.adminUser.carts.cartItems.erase(
    connection,
    {
      cartId,
      cartItemId,
    },
  );

  // 4. Test error: delete non-existent cart item
  await TestValidator.error(
    "delete non-existent cart item should fail",
    async () => {
      const fakeCartId = typia.random<string & tags.Format<"uuid">>();
      const fakeCartItemId = typia.random<string & tags.Format<"uuid">>();
      await api.functional.shoppingMall.adminUser.carts.cartItems.erase(
        connection,
        {
          cartId: fakeCartId,
          cartItemId: fakeCartItemId,
        },
      );
    },
  );

  // 5. Test error: delete cart item without authentication
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "delete cart item without authentication should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.carts.cartItems.erase(
        unauthenticatedConnection,
        {
          cartId,
          cartItemId,
        },
      );
    },
  );
}
