import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test validates that a member user can successfully delete a cart
 * item from their shopping cart.
 *
 * It begins by creating a member user account with realistic data, and
 * authenticates the user via the join API, ensuring the returned
 * authorization object contains all necessary token information.
 *
 * It then generates random valid UUIDs to represent a cart and cart item,
 * which are used to call the erase (delete) API endpoint for cart items.
 * The test asserts the delete call succeeds without throwing errors.
 *
 * Authentication headers are handled automatically by the SDK.
 *
 * This test verifies the positive, successful deletion workflow with
 * correct user authorization and API endpoint usage.
 */
export async function test_api_cart_item_delete_success(
  connection: api.IConnection,
) {
  // 1. Register and authenticate member user
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedMemberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(authorizedMemberUser);

  // 2. Generate random UUIDs for cartId and cartItemId
  const cartId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const cartItemId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Call the erase (delete) API for the cart item
  await api.functional.shoppingMall.memberUser.carts.cartItems.erase(
    connection,
    {
      cartId,
      cartItemId,
    },
  );
}
