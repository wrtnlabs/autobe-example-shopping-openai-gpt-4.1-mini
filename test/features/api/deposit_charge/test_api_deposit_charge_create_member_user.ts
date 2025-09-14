import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test verifies the creation of a deposit charge application
 * record by an authenticated member user. It incorporates the full user
 * journey of member user registration, login, and deposit charge creation.
 *
 * The test ensures all required properties are included with realistic and
 * schema-compliant values. After deposit charge creation, it validates the
 * response structure and content, confirming that the member user ID,
 * charge amount, status, payment provider, payment account, and timestamps
 * are correctly assigned and formatted.
 *
 * The test strictly follows the DTO definitions and descriptions, using
 * typia.random for compliant random data generation, RandomGenerator
 * utilities for strings, and typia.assert for complete type safety checks.
 *
 * It mirrors a real-world user scenario, guaranteeing the API behaves as
 * expected under typical user conditions.
 */
export async function test_api_deposit_charge_create_member_user(
  connection: api.IConnection,
) {
  // Step 1: Register a member user account
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUserAuthorized = await api.functional.auth.memberUser.join(
    connection,
    { body: memberUserCreateBody },
  );
  typia.assert(memberUserAuthorized);

  // Step 2: Login the created member user
  const memberUserLoginBody = {
    email: memberUserCreateBody.email as string & tags.Format<"email">,
    password: memberUserCreateBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;

  const memberUserLoggedIn = await api.functional.auth.memberUser.login(
    connection,
    { body: memberUserLoginBody },
  );
  typia.assert(memberUserLoggedIn);

  // Step 3: Create deposit charge application
  const depositChargeCreateBody = {
    memberuser_id: memberUserLoggedIn.id,
    charge_amount: Math.floor(
      typia.random<
        number & tags.Type<"uint32"> & tags.Minimum<1> & tags.Maximum<100000>
      >(),
    ),
    charge_status: "pending",
    payment_provider: "BankTransfer",
    payment_account: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallDepositCharge.ICreate;

  const depositCharge =
    await api.functional.shoppingMall.memberUser.depositCharges.createDepositCharge(
      connection,
      { body: depositChargeCreateBody },
    );
  typia.assert(depositCharge);

  // Step 4: Validate properties returned
  TestValidator.equals(
    "member user id matches",
    depositCharge.memberuser_id,
    memberUserLoggedIn.id,
  );
  TestValidator.predicate(
    "charge amount is positive",
    depositCharge.charge_amount > 0,
  );
  TestValidator.equals(
    "charge status is pending",
    depositCharge.charge_status,
    "pending",
  );
  TestValidator.predicate(
    "payment provider is non-empty",
    depositCharge.payment_provider.length > 0,
  );
  TestValidator.predicate(
    "payment account is non-empty",
    depositCharge.payment_account.length > 0,
  );
  TestValidator.predicate(
    "deposit charge id is valid uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      depositCharge.id,
    ),
  );
  TestValidator.predicate(
    "timestamps exist",
    depositCharge.created_at !== "" && depositCharge.updated_at !== "",
  );
}
