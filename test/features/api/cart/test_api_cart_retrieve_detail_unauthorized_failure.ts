import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test unauthorized attempt to retrieve cart details without authentication
 * or by another user, expecting authorization failure responses.
 *
 * This test verifies authorization enforcement on the cart detail retrieval
 * endpoint. It ensures that unauthenticated users and authenticated users
 * who do not own the cart cannot access the cart details.
 *
 * Test scenario:
 *
 * 1. Create and authenticate user A.
 * 2. Create and authenticate user B.
 * 3. Generate an arbitrary cart UUID for user A's cart.
 * 4. Attempt to retrieve the cart as unauthenticated user. Expect failure.
 * 5. Attempt to retrieve the cart as user B. Expect failure.
 */
export async function test_api_cart_retrieve_detail_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Create and authenticate member user A
  const userACreateBody = {
    email: `${RandomGenerator.name(1)}@example.com`,
    password_hash: "hashedpassword123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const userA: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userACreateBody,
    });
  typia.assert(userA);

  // 2. Create and authenticate member user B
  const userBCreateBody = {
    email: `${RandomGenerator.name(1)}@example.com`,
    password_hash: "hashedpassword456",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const userB: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userBCreateBody,
    });
  typia.assert(userB);

  // 3. Generate a random UUID representing user A's cart
  const cartId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Attempt unauthorized retrieval without any authentication
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthenticated user cannot retrieve cart details",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.getCart(
        unauthenticatedConnection,
        {
          cartId,
        },
      );
    },
  );

  // 5. Attempt retrieval as user B (not the cart owner)
  const userBConnection: api.IConnection = {
    ...connection,
    headers: {
      Authorization: userB.token.access,
    },
  };

  await TestValidator.error(
    "user B cannot retrieve user A's cart details",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.getCart(
        userBConnection,
        {
          cartId,
        },
      );
    },
  );
}
