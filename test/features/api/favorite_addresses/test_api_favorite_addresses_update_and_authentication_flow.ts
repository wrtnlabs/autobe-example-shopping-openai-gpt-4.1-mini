import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test updating an existing favorite address by ID for an authenticated member
 * user. Include authentication by join operation, favorite address creation,
 * and favorite address update with valid values. Verify the updated favorite
 * address reflects changes and audit timestamps update. Include negative case
 * for unauthorized access by skipping auth or attempting to update other users'
 * favorites.
 */
export async function test_api_favorite_addresses_update_and_authentication_flow(
  connection: api.IConnection,
) {
  // Join first member user
  const memberUserBody1 = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser1: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody1,
    });
  typia.assert(authorizedUser1);

  // Create a favorite address for the authorized user
  const favoriteAddressCreateBody1 = {
    shopping_mall_memberuser_id: authorizedUser1.id,
    shopping_mall_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallFavoriteAddress.ICreate;

  const favoriteAddress: IShoppingMallFavoriteAddress =
    await api.functional.shoppingMall.memberUser.favoriteAddresses.create(
      connection,
      {
        body: favoriteAddressCreateBody1,
      },
    );
  typia.assert(favoriteAddress);

  // Store original timestamps for comparison later
  const originalCreatedAt = favoriteAddress.created_at;
  const originalUpdatedAt = favoriteAddress.updated_at;

  // Update the favorite address with new snapshot_id and unchanged memberuser_id
  // generate a different UUID for shopping_mall_snapshot_id
  let newSnapshotId: string & tags.Format<"uuid">;
  do {
    newSnapshotId = typia.random<string & tags.Format<"uuid">>();
  } while (newSnapshotId === favoriteAddress.shopping_mall_snapshot_id);

  const favoriteAddressUpdateBody = {
    shopping_mall_memberuser_id: authorizedUser1.id,
    shopping_mall_snapshot_id: newSnapshotId,
    deleted_at: null,
  } satisfies IShoppingMallFavoriteAddress.IUpdate;

  const updatedFavoriteAddress: IShoppingMallFavoriteAddress =
    await api.functional.shoppingMall.memberUser.favoriteAddresses.update(
      connection,
      {
        favoriteAddressId: favoriteAddress.id,
        body: favoriteAddressUpdateBody,
      },
    );

  typia.assert(updatedFavoriteAddress);

  // Validations
  TestValidator.equals(
    "updated favorite address ID unchanged",
    updatedFavoriteAddress.id,
    favoriteAddress.id,
  );

  TestValidator.equals(
    "updated favorite address member user ID unchanged",
    updatedFavoriteAddress.shopping_mall_memberuser_id,
    authorizedUser1.id,
  );

  TestValidator.equals(
    "updated favorite address snapshot ID updated",
    updatedFavoriteAddress.shopping_mall_snapshot_id,
    newSnapshotId,
  );

  TestValidator.predicate(
    "updated favorite address updated_at timestamp is newer",
    new Date(updatedFavoriteAddress.updated_at).getTime() >=
      new Date(originalUpdatedAt).getTime(),
  );

  TestValidator.predicate(
    "updated favorite address created_at timestamp unchanged",
    updatedFavoriteAddress.created_at === favoriteAddress.created_at,
  );

  // Negative Test: Attempt update without authentication (unauthenticated connection)
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "update favorite address without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteAddresses.update(
        unauthConnection,
        {
          favoriteAddressId: favoriteAddress.id,
          body: favoriteAddressUpdateBody,
        },
      );
    },
  );

  // Negative Test: Try to update another user's favorite address
  // Join second authorized user
  const memberUserBody2 = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser2: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody2,
    });
  typia.assert(authorizedUser2);

  // Now connection is authenticated as authorizedUser2
  await TestValidator.error(
    "user should not update favorite address of another user",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteAddresses.update(
        connection,
        {
          favoriteAddressId: favoriteAddress.id,
          body: {
            shopping_mall_memberuser_id: authorizedUser1.id,
            shopping_mall_snapshot_id: typia.random<
              string & tags.Format<"uuid">
            >(),
          } satisfies IShoppingMallFavoriteAddress.IUpdate,
        },
      );
    },
  );
}
