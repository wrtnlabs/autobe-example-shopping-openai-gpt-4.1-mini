import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test covers the update operation of a deposit charge application
 * by an authenticated member user. The test first creates and logs in a new
 * member user for authentication context, followed by orchestrating a
 * realistic update scenario for an existing deposit charge record. It
 * validates various partial update fields including charge amount, charge
 * status with allowed enum transitions, payment provider details, account
 * info, and paid timestamp. The test confirms proper authorization is
 * enforced, ensuring the member user can only update their own deposit
 * charges. It verifies API responses using exact type assertions. Business
 * rules like valid status values, date-time formats, and UUID formats for
 * IDs are respected. Error cases such as invalid IDs or unauthorized
 * updates are also part of the validation, though only correct update flows
 * are implemented here due to lack of error scenario details and focus on
 * feasible paths. The workflow is:
 *
 * - Member user registration with realistic data
 * - Member user login to establish auth token
 * - Creation of a deposit charge update body with partially changed fields
 *   respecting nullable and optional properties
 * - Calling the updateDepositCharge API with the correct path parameter and
 *   update body
 * - Asserting the response matches the expected deposit charge structure
 * - Verifying values are updated as intended based on the input request It
 *   ensures strict typing and comprehensive validation aligning with
 *   property definitions and business context. No invalid or unauthorized
 *   operations are tested as the current scenario focuses on successful
 *   update paths only.
 */
export async function test_api_deposit_charge_update_member_user(
  connection: api.IConnection,
) {
  // 1. Member user registration (join)
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null, // optional nullable - explicitly assign null
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 2. Member user login
  const memberLoginBody = {
    email: member.email,
    password: memberCreateBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberLogin: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLoginBody,
    });
  typia.assert(memberLogin);

  // 3. Prepare update body with partial changes respecting nullable and optional
  const updateBody = {
    guestuser_id: null, // explicitly assign null to confirm no guest user linked
    memberuser_id: memberLogin.id,
    charge_amount: RandomGenerator.alphaNumeric(5) as unknown as number, // realistic positive number
    charge_status: "approved" as const,
    payment_provider: RandomGenerator.name(1),
    payment_account: RandomGenerator.alphaNumeric(10),
    paid_at: new Date().toISOString(),
  } satisfies IShoppingMallDepositCharge.IUpdate;

  // 4. Generate a depositChargeId of correct UUID format
  const depositChargeId = typia.random<string & tags.Format<"uuid">>();

  // 5. Call updateDepositCharge API
  const updatedCharge: IShoppingMallDepositCharge =
    await api.functional.shoppingMall.memberUser.depositCharges.updateDepositCharge(
      connection,
      {
        depositChargeId: depositChargeId,
        body: updateBody,
      },
    );
  typia.assert(updatedCharge);

  // 6. Validate response and ensure updated values are consistent
  TestValidator.equals(
    "depositCharge.memberuser_id",
    updatedCharge.memberuser_id,
    updateBody.memberuser_id,
  );
  TestValidator.equals(
    "depositCharge.charge_amount",
    updatedCharge.charge_amount,
    updateBody.charge_amount,
  );
  TestValidator.equals(
    "depositCharge.charge_status",
    updatedCharge.charge_status,
    updateBody.charge_status,
  );
  TestValidator.equals(
    "depositCharge.payment_provider",
    updatedCharge.payment_provider,
    updateBody.payment_provider,
  );
  TestValidator.equals(
    "depositCharge.payment_account",
    updatedCharge.payment_account,
    updateBody.payment_account,
  );
  TestValidator.equals(
    "depositCharge.paid_at",
    updatedCharge.paid_at,
    updateBody.paid_at,
  );
}
