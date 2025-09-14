import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test updating a member user's deposit record successfully, and validate
 * that an unauthorized user cannot update another user's deposit.
 *
 * This test performs the following business steps:
 *
 * 1. Member user signs up (creates account and authenticates).
 * 2. Create an initial deposit record linked to the member user.
 * 3. Update the deposit record with new amounts and validity dates.
 * 4. Another member user signs up for unauthorized update test.
 * 5. Attempt updating the first member user's deposit from unauthorized user
 *    context and expect failure.
 *
 * Each step validates API responses with typia.assert and ensures data
 * correctness. The test uses the actual APIs for creating members,
 * deposits, and updating deposits, with proper data generation and
 * validation.
 */
export async function test_api_deposit_update_success_and_auth_failure(
  connection: api.IConnection,
) {
  // 1. Member user signs up to create a new account and authenticate
  const memberUser1Email = typia.random<string & tags.Format<"email">>();
  const memberUser1: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUser1Email,
        password_hash: "validPassword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null, // Explicit null as per schema
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser1);

  // 2. Create a deposit record linked to memberUser1
  const now = new Date();
  const depositCreateBody = {
    memberuser_id: memberUser1.id,
    deposit_amount: 100000,
    usable_balance: 80000,
    deposit_start_at: now.toISOString(),
    deposit_end_at: new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  } satisfies IShoppingMallDeposit.ICreate;

  const deposit1: IShoppingMallDeposit =
    await api.functional.shoppingMall.memberUser.deposits.create(connection, {
      body: depositCreateBody,
    });
  typia.assert(deposit1);

  // 3. Update the deposit record with new values
  const depositUpdateBody = {
    deposit_amount: 120000,
    usable_balance: 90000,
    deposit_start_at: new Date(
      now.getTime() + 1 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 1 day later
    deposit_end_at: new Date(
      now.getTime() + 60 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 60 days later
  } satisfies IShoppingMallDeposit.IUpdate;

  const updatedDeposit: IShoppingMallDeposit =
    await api.functional.shoppingMall.memberUser.deposits.updateDeposit(
      connection,
      {
        depositId: deposit1.id,
        body: depositUpdateBody,
      },
    );
  typia.assert(updatedDeposit);

  // Validate updated fields
  TestValidator.equals(
    "Deposit amount updated",
    updatedDeposit.deposit_amount,
    depositUpdateBody.deposit_amount,
  );
  TestValidator.equals(
    "Usable balance updated",
    updatedDeposit.usable_balance,
    depositUpdateBody.usable_balance,
  );
  TestValidator.equals(
    "Deposit start date updated",
    updatedDeposit.deposit_start_at,
    depositUpdateBody.deposit_start_at,
  );
  TestValidator.equals(
    "Deposit end date updated",
    updatedDeposit.deposit_end_at,
    depositUpdateBody.deposit_end_at,
  );

  // 4. Another member user signs up for unauthorized update test
  const memberUser2Email = typia.random<string & tags.Format<"email">>();
  const memberUser2: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUser2Email,
        password_hash: "anotherValidPass!234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null, // Explicit null
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser2);

  // 5. Try to update deposit1 from memberUser2's context
  await TestValidator.error(
    "Unauthorized user cannot update another member's deposit",
    async () => {
      await api.functional.shoppingMall.memberUser.deposits.updateDeposit(
        connection,
        {
          depositId: deposit1.id,
          body: {
            deposit_amount: 50000,
          } satisfies IShoppingMallDeposit.IUpdate,
        },
      );
    },
  );
}
