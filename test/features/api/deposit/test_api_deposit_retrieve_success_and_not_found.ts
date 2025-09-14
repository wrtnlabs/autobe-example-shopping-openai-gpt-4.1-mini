import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test the successful retrieval of detailed deposit information for a
 * member user.
 *
 * This E2E test covers the entire user journey including:
 *
 * 1. Member user creation via the join authentication API,
 * 2. Deposit record creation associating with the created member user,
 * 3. Retrieval of the deposit detail by deposit ID within the authenticated
 *    member user context,
 * 4. Validation of deposit fields including deposit amount, usable balance,
 *    linked member user ID, and timestamps,
 * 5. Error handling verifying not found error when using a non-existent
 *    deposit ID.
 *
 * The scenario ensures correct API functionality and enforces business
 * rules around deposits.
 */
export async function test_api_deposit_retrieve_success_and_not_found(
  connection: api.IConnection,
) {
  // 1. Member user creation
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 2. Create a deposit record
  const dateNowISOString = new Date().toISOString();
  // Set deposit period from now for 30 days
  const depositStartAt = dateNowISOString;
  const depositEndAt = new Date(Date.now() + 30 * 86400 * 1000).toISOString();

  const depositCreateBody = {
    memberuser_id: member.id,
    deposit_amount: 100000, // realistic deposit amount
    usable_balance: 100000, // all usable at start
    deposit_start_at: depositStartAt,
    deposit_end_at: depositEndAt,
  } satisfies IShoppingMallDeposit.ICreate;

  const deposit: IShoppingMallDeposit =
    await api.functional.shoppingMall.memberUser.deposits.create(connection, {
      body: depositCreateBody,
    });
  typia.assert(deposit);

  // 3. Retrieve the deposit details by deposit ID
  const retrievedDeposit: IShoppingMallDeposit =
    await api.functional.shoppingMall.memberUser.deposits.at(connection, {
      depositId: deposit.id,
    });
  typia.assert(retrievedDeposit);

  // 4. Validate that the retrieved deposit matches the created one
  TestValidator.equals(
    "deposit amount matches",
    retrievedDeposit.deposit_amount,
    depositCreateBody.deposit_amount,
  );
  TestValidator.equals(
    "usable balance matches",
    retrievedDeposit.usable_balance,
    depositCreateBody.usable_balance,
  );
  TestValidator.equals(
    "member user ID matches",
    retrievedDeposit.memberuser_id,
    depositCreateBody.memberuser_id,
  );

  // Validate deposit_start_at and deposit_end_at timestamps
  TestValidator.equals(
    "deposit start date matches",
    retrievedDeposit.deposit_start_at,
    depositCreateBody.deposit_start_at,
  );
  TestValidator.equals(
    "deposit end date matches",
    retrievedDeposit.deposit_end_at,
    depositCreateBody.deposit_end_at,
  );

  // Validate created_at and updated_at timestamps exist and are ISO date-time strings
  typia.assert<string & tags.Format<"date-time">>(retrievedDeposit.created_at);
  typia.assert<string & tags.Format<"date-time">>(retrievedDeposit.updated_at);

  // 5. Test error scenario: retrieving non-existent deposit ID
  const fakeDepositId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "should error when deposit ID not found",
    async () => {
      await api.functional.shoppingMall.memberUser.deposits.at(connection, {
        depositId: fakeDepositId,
      });
    },
  );
}
