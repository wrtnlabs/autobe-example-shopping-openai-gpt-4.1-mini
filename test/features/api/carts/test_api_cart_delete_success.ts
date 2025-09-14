import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate the deletion operation of a shopping cart for an authenticated
 * member user.
 *
 * This test covers:
 *
 * 1. Joining a new member user to establish authentication context.
 * 2. Successful deletion of a cart by a valid cartId.
 * 3. Error handling when attempting to delete a non-existent cartId.
 * 4. Unauthorized access validation by trying to delete a cart without
 *    authentication.
 *
 * All API responses are validated for type safety using typia.assert. The
 * test enforces that the 'memberUser' role and authentication are required
 * for deletion.
 *
 * @param connection - API connection instance with authorization context
 */
export async function test_api_cart_delete_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a member user
  const memberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberUserBody,
  });
  typia.assert(memberUser);

  // 2. Define a valid cart ID for deletion (simulated UUID)
  const validCartId = typia.random<string & tags.Format<"uuid">>();

  // 3. Successfully delete cart identified by validCartId
  await api.functional.shoppingMall.memberUser.carts.eraseCart(connection, {
    cartId: validCartId,
  });

  // 4. Attempt to delete a cart with a non-existent cartId and expect error
  const nonExistentCartId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "deletion of non-existent cartId should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.eraseCart(connection, {
        cartId: nonExistentCartId,
      });
    },
  );

  // 5. Attempt deletion without authentication; expect error
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "deletion without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.eraseCart(unauthConn, {
        cartId: validCartId,
      });
    },
  );
}
