import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_cart_update_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Create member user A
  const userABody = {
    email: `userA_${typia.random<string & tags.Format<"email">>()}`,
    password_hash: "passwordA123",
    nickname: `nickA_${RandomGenerator.name(1)}`,
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const userA = await api.functional.auth.memberUser.join(connection, {
    body: userABody,
  });
  typia.assert(userA);

  // 2. No cart creation API is provided; we will simulate a cart ID that belongs to userA to test unauthorized update.

  // 3. Create member user B. This also authenticates as B.
  const userBBody = {
    email: `userB_${typia.random<string & tags.Format<"email">>()}`,
    password_hash: "passwordB123",
    nickname: `nickB_${RandomGenerator.name(1)}`,
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const userB = await api.functional.auth.memberUser.join(connection, {
    body: userBBody,
  });
  typia.assert(userB);

  // 4. Attempt to update userA's cart with userB's authentication context
  const updateBody = {
    member_user_id: userA.id,
    status: "active",
    guest_user_id: null,
    deleted_at: null,
  } satisfies IShoppingMallCarts.IUpdate;

  await TestValidator.error(
    "unauthorized user cannot update someone else's cart",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.updateCart(
        connection,
        {
          cartId: typia.random<string & tags.Format<"uuid">>(),
          body: updateBody,
        },
      );
    },
  );
}
