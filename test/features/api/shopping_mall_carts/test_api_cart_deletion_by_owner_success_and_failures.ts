import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test verifies that an authenticated 'memberUser' can delete their
 * own shopping cart successfully, and validates failure cases when deletion
 * is attempted by other users or unauthenticated connections.
 *
 * The workflow includes:
 *
 * 1. Creating member user A and authenticating.
 * 2. Member user A creates a cart.
 * 3. Member user A deletes their own cart successfully.
 * 4. Creating member user B and authenticating.
 * 5. Member user B creates their own cart.
 * 6. Member user A attempts to delete member user B's cart (expect failure).
 * 7. Unauthenticated attempt to delete member user B's cart (expect failure).
 *
 * Authentication tokens are managed separately via cloned connection
 * objects to avoid overlapping.
 */
export async function test_api_cart_deletion_by_owner_success_and_failures(
  connection: api.IConnection,
) {
  // Clone connection to isolate authentication contexts
  const connectionMemberA: api.IConnection = { ...connection, headers: {} };
  const connectionMemberB: api.IConnection = { ...connection, headers: {} };

  // 1. Create member user A
  const memberUserAEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const memberUserA = await api.functional.auth.memberUser.join(
    connectionMemberA,
    {
      body: {
        email: memberUserAEmail,
        password_hash: "TestPass123!",
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    },
  );
  typia.assert(memberUserA);

  // 2. MemberUser A creates a shopping cart
  const cartA = await api.functional.shoppingMall.memberUser.carts.createCart(
    connectionMemberA,
    {
      body: {
        member_user_id: memberUserA.id,
        guest_user_id: null,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    },
  );
  typia.assert(cartA);

  // 3. MemberUser A deletes their own cart successfully
  await api.functional.shoppingMall.memberUser.carts.eraseCart(
    connectionMemberA,
    {
      cartId: cartA.id,
    },
  );

  // 4. Create member user B
  const memberUserBEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const memberUserB = await api.functional.auth.memberUser.join(
    connectionMemberB,
    {
      body: {
        email: memberUserBEmail,
        password_hash: "TestPass123!",
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    },
  );
  typia.assert(memberUserB);

  // 5. MemberUser B creates their own shopping cart
  const cartB = await api.functional.shoppingMall.memberUser.carts.createCart(
    connectionMemberB,
    {
      body: {
        member_user_id: memberUserB.id,
        guest_user_id: null,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    },
  );
  typia.assert(cartB);

  // 6. MemberUser A attempts to delete memberUser B's cart (expect error)
  await TestValidator.error(
    "MemberUser A cannot delete MemberUser B's cart",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.eraseCart(
        connectionMemberA,
        {
          cartId: cartB.id,
        },
      );
    },
  );

  // 7. Unauthenticated attempt to delete memberUser B's cart
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "Unauthenticated user cannot delete cart",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.eraseCart(
        unauthConnection,
        {
          cartId: cartB.id,
        },
      );
    },
  );
}
