import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * E2E Test for updating a member user's shopping cart by cartId.
 *
 * Tests membership user joining for authentication, updating cart
 * properties, and validating correct persistence and error scenarios.
 *
 * Workflow:
 *
 * 1. Member user joins and authenticates.
 * 2. Generates a valid cartId UUID.
 * 3. Updates cart with status, member_user_id, guest_user_id (null), and
 *    deleted_at (null).
 * 4. Validates response matches input.
 * 5. Tests error on invalid cartId format.
 * 6. (Optional) Tests unauthorized access error.
 *
 * Uses typia.assert for type validation and TestValidator for assertion
 * checks.
 */
export async function test_api_cart_update_success(
  connection: api.IConnection,
) {
  // 1. Member user join to create and authenticate member user
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      },
    });
  typia.assert(memberUser);

  // 2. Prepare a valid cartId to update
  const cartId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Construct update body
  const updateBody = {
    status: "active",
    member_user_id: memberUser.id,
    guest_user_id: null,
    deleted_at: null,
  } satisfies IShoppingMallCarts.IUpdate;

  // 4. Call updateCart API
  const updatedCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.updateCart(connection, {
      cartId,
      body: updateBody,
    });
  typia.assert(updatedCart);

  // 5. Validate returned cart's relevant fields
  TestValidator.equals("updated cart id matches input", updatedCart.id, cartId);
  TestValidator.equals(
    "updated cart status matches input",
    updatedCart.status,
    updateBody.status!,
  );
  TestValidator.equals(
    "updated cart member_user_id matches input",
    updatedCart.member_user_id,
    updateBody.member_user_id,
  );
  TestValidator.equals(
    "updated cart guest_user_id is null",
    updatedCart.guest_user_id,
    null,
  );
  TestValidator.equals(
    "updated cart deleted_at is null",
    updatedCart.deleted_at,
    null,
  );

  // 6. Test error on invalid cartId format
  await TestValidator.error("invalid cartId format should throw", async () => {
    await api.functional.shoppingMall.memberUser.carts.updateCart(connection, {
      cartId: "invalid-uuid-format",
      body: updateBody,
    });
  });

  // 7. (Optional) Test unauthorized update attempt with unauthenticated connection
  const unauthenticatedConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthenticated update attempt should throw",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.updateCart(
        unauthenticatedConn,
        {
          cartId,
          body: updateBody,
        },
      );
    },
  );
}
