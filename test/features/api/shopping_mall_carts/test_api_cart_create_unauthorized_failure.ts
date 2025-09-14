import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_cart_create_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Member user joins (setup prerequisite)
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Create an unauthorized connection with empty headers
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Prepare a cart creation body with required status and no user ID
  // Explicitly pass null for member_user_id and guest_user_id
  const cartCreateBody = {
    member_user_id: null,
    guest_user_id: null,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;

  // 4. Expect createCart call with unauthorized connection to throw error
  await TestValidator.error(
    "unauthorized createCart call should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.createCart(
        unauthorizedConnection,
        {
          body: cartCreateBody,
        },
      );
    },
  );
}
