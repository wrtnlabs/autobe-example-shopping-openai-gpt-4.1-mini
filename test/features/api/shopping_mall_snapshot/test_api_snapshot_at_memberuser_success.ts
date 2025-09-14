import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSnapshot";

/**
 * End-to-end test for retrieving member user snapshots.
 *
 * This test performs the following steps:
 *
 * 1. Create a member user account (join).
 * 2. Log in with the same credentials to acquire authentication.
 * 3. Attempts to retrieve a snapshot with an invalid/non-existent ID,
 *    confirming failure.
 *
 * Note: Since no API endpoint exists for creating snapshots, the success
 * test of retrieving an actual snapshot is not implemented due to lack of
 * snapshot creation API.
 *
 * This ensures the authentication workflow and error handling for snapshot
 * retrieval.
 */
export async function test_api_snapshot_at_memberuser_success(
  connection: api.IConnection,
) {
  // 1. Create member user join data with valid randomized info
  const createBody = {
    email: `user_${RandomGenerator.alphaNumeric(8)}@test.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null, // explicitly null since optional
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  // 2. Sign up member user
  const joined: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createBody });
  typia.assert(joined);

  // 3. Log in member user with email and password
  const loginBody = {
    email: createBody.email,
    password: createBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;

  const loggedIn: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, { body: loginBody });
  typia.assert(loggedIn);

  // 4. Test error case for non-existent snapshot (should throw)
  const invalidId = "00000000-0000-0000-0000-000000000000" as string &
    tags.Format<"uuid">;
  await TestValidator.error(
    "retrieving non-existent snapshot should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.snapshots.atSnapshot(
        connection,
        { id: invalidId },
      );
    },
  );
}
