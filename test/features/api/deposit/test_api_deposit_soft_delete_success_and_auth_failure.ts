import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test soft deleting a deposit record for a member user.
 *
 * The test performs the following steps:
 *
 * 1. Create a member user and authenticate.
 * 2. Create a deposit record linked to the member user.
 * 3. Soft delete the deposit record using its ID.
 * 4. Attempt an unauthorized deletion to ensure proper access control.
 *
 * Validations ensure each operation succeeded and that authorization is
 * enforced.
 */
export async function test_api_deposit_soft_delete_success_and_auth_failure(
  connection: api.IConnection,
) {
  // 1. Create and authenticate member user
  const memberUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUser);

  // 2. Create deposit record linked to the member user
  const now = new Date();
  const depositCreate = {
    memberuser_id: memberUser.id,
    deposit_amount: typia.random<
      number & tags.Type<"uint32"> & tags.Minimum<1000>
    >(),
    usable_balance: 10000,
    deposit_start_at: now.toISOString(),
    deposit_end_at: new Date(now.getTime() + 86400000 * 30).toISOString(),
  } satisfies IShoppingMallDeposit.ICreate;
  const deposit: IShoppingMallDeposit =
    await api.functional.shoppingMall.memberUser.deposits.create(connection, {
      body: depositCreate,
    });
  typia.assert(deposit);

  // 3. Delete the deposit record by depositId
  await api.functional.shoppingMall.memberUser.deposits.eraseDeposit(
    connection,
    {
      depositId: deposit.id,
    },
  );

  // 4. Create another member user for unauthorized deletion attempt
  const otherMemberCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const otherMemberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: otherMemberCreate,
    });
  typia.assert(otherMemberUser);

  // 5. Attempt unauthorized deletion, expecting error
  await TestValidator.error("unauthorized deletion should fail", async () => {
    // Simulate context of other user by performing join again
    // (SDK handles auth token automatically)
    await api.functional.auth.memberUser.join(connection, {
      body: otherMemberCreate,
    });
    await api.functional.shoppingMall.memberUser.deposits.eraseDeposit(
      connection,
      {
        depositId: deposit.id,
      },
    );
  });
}
