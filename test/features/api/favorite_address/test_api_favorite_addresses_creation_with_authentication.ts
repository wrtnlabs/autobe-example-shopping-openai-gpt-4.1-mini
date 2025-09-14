import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test creating a new favorite address entry for an authenticated member user.
 *
 * This test performs a full user journey to create a favorite address:
 *
 * 1. A member user joins and authenticates.
 * 2. Using the authenticated session, a new favorite address is created with valid
 *    user ID and address snapshot.
 * 3. The returned favorite address is validated for correctness including IDs and
 *    timestamps.
 * 4. Additionally, a failure test is done by attempting to create a favorite
 *    address without authentication, which should fail.
 */
export async function test_api_favorite_addresses_creation_with_authentication(
  connection: api.IConnection,
) {
  // 1. Member user joins with realistic data
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: joinBody });
  typia.assert(authorizedUser);

  // 2. Using authenticated connection, create a favorite address for this user
  // Generate a random UUID for snapshot ID
  const snapshotId = typia.random<string & tags.Format<"uuid">>();

  const favoriteAddressCreateBody = {
    shopping_mall_memberuser_id: authorizedUser.id,
    shopping_mall_snapshot_id: snapshotId,
  } satisfies IShoppingMallFavoriteAddress.ICreate;

  const favoriteAddress: IShoppingMallFavoriteAddress =
    await api.functional.shoppingMall.memberUser.favoriteAddresses.create(
      connection,
      { body: favoriteAddressCreateBody },
    );
  typia.assert(favoriteAddress);

  // Validate returned details
  TestValidator.predicate(
    "favorite address id exists",
    typeof favoriteAddress.id === "string" && favoriteAddress.id.length > 0,
  );
  TestValidator.equals(
    "favorite address member user id matches",
    favoriteAddress.shopping_mall_memberuser_id,
    authorizedUser.id,
  );
  TestValidator.equals(
    "favorite address snapshot id matches",
    favoriteAddress.shopping_mall_snapshot_id,
    snapshotId,
  );
  TestValidator.predicate(
    "favorite address created_at timestamp present",
    typeof favoriteAddress.created_at === "string" &&
      favoriteAddress.created_at.length > 0,
  );
  TestValidator.predicate(
    "favorite address updated_at timestamp present",
    typeof favoriteAddress.updated_at === "string" &&
      favoriteAddress.updated_at.length > 0,
  );

  // 3. Attempt to create favorite address without authentication
  // Create a new connection without auth headers (unauthenticated)
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "unauthorized favorite address creation should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteAddresses.create(
        unauthConn,
        { body: favoriteAddressCreateBody },
      );
    },
  );
}
