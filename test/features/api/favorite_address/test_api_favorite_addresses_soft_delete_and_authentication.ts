import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate deletion and authentication for favorite address.
 *
 * This test covers member user join authentication, creation of a favorite
 * address, followed by its deletion and related error handling scenarios.
 * It includes unauthorized access and invalid ID attempts.
 *
 * Steps:
 *
 * 1. Join a member user and authenticate.
 * 2. Create a favorite address tied to the authenticated member.
 * 3. Delete the favorite address by its ID (hard delete as per API spec).
 * 4. Verify repeated delete attempts result in errors.
 * 5. Verify unauthorized deletion attempts are rejected.
 * 6. Verify deletion attempts with invalid IDs are rejected.
 */
export async function test_api_favorite_addresses_soft_delete_and_authentication(
  connection: api.IConnection,
) {
  // 1. Member user join and authenticate
  const memberUserCreationData = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(1),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const authorizedMemberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreationData,
    });
  typia.assert(authorizedMemberUser);

  // 2. Create a favorite address
  const favoriteAddressCreationData = {
    shopping_mall_memberuser_id: authorizedMemberUser.id,
    shopping_mall_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallFavoriteAddress.ICreate;

  const favoriteAddress: IShoppingMallFavoriteAddress =
    await api.functional.shoppingMall.memberUser.favoriteAddresses.create(
      connection,
      {
        body: favoriteAddressCreationData,
      },
    );
  typia.assert(favoriteAddress);

  TestValidator.equals(
    "favorite address member user ID matches",
    favoriteAddress.shopping_mall_memberuser_id,
    authorizedMemberUser.id,
  );

  // 3. Delete the favorite address by id
  await api.functional.shoppingMall.memberUser.favoriteAddresses.eraseFavoriteAddress(
    connection,
    { favoriteAddressId: favoriteAddress.id },
  );

  // 4. Attempt to delete again should error
  await TestValidator.error(
    "cannot delete favorite address twice",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteAddresses.eraseFavoriteAddress(
        connection,
        { favoriteAddressId: favoriteAddress.id },
      );
    },
  );

  // 5. Attempt deletion with unauthorized connection
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized deletion should fail", async () => {
    await api.functional.shoppingMall.memberUser.favoriteAddresses.eraseFavoriteAddress(
      unauthenticatedConnection,
      { favoriteAddressId: favoriteAddress.id },
    );
  });

  // 6. Attempt deletion with invalid favoriteAddressId
  await TestValidator.error(
    "invalid favoriteAddressId deletion should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteAddresses.eraseFavoriteAddress(
        connection,
        { favoriteAddressId: typia.random<string & tags.Format<"uuid">>() },
      );
    },
  );
}
