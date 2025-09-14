import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test validates detailed retrieval of a deposit charge by an
 * authenticated member user.
 *
 * The test covers member user registration and login to establish
 * authentication context. It attempts to fetch deposit charge details using
 * a simulated UUID ID. It ensures the returned deposit charge belongs to
 * the authenticated member user, validates response structure, and tests
 * error handling with a non-existent ID.
 *
 * Since deposit charge creation API is not available, the test uses a
 * randomly generated UUID to fetch deposit charge, acknowledging potential
 * fetch failure based on test environment.
 *
 * The test confirms authorization, data integrity, and error responses for
 * missing records.
 */
export async function test_api_deposit_charge_fetch_detail_member_user(
  connection: api.IConnection,
) {
  // 1. Register a new member user (sign-up) with required member details
  const createBody = {
    email: RandomGenerator.alphaNumeric(5) + "@example.com",
    password_hash: "SecureP@ssw0rd123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createBody });
  typia.assert(member);

  // 2. Log in as the registered member user using email and password
  const loginBody = {
    email: createBody.email,
    password: "SecureP@ssw0rd123",
  } satisfies IShoppingMallMemberUser.ILogin;

  const loggedInMember: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, { body: loginBody });
  typia.assert(loggedInMember);

  TestValidator.equals(
    "login email should match created email",
    loggedInMember.email,
    createBody.email,
  );

  // 3. Use a simulated deposit charge UUID
  const simulatedDepositChargeId = typia.random<string & tags.Format<"uuid">>();

  // 4. Fetch deposit charge details by simulated ID
  try {
    const depositCharge: IShoppingMallDepositCharge =
      await api.functional.shoppingMall.memberUser.depositCharges.atDepositCharge(
        connection,
        { depositChargeId: simulatedDepositChargeId },
      );
    typia.assert(depositCharge);

    // Validate that the deposit charge's memberuser_id matches logged in member id
    // Since memberuser_id is optional, check for null or undefined
    const memberUserId = depositCharge.memberuser_id;

    TestValidator.predicate(
      "deposit charge belongs to the logged in member user",
      memberUserId !== null &&
        memberUserId !== undefined &&
        memberUserId === member.id,
    );
  } catch (error) {
    throw error; // Re-throw any exception
  }

  // 5. Test error scenario for non-existent deposit charge ID
  const nonExistentId =
    "00000000-0000-0000-0000-000000000000" satisfies string &
      tags.Format<"uuid">;

  await TestValidator.error(
    "fetching deposit charge with invalid non-existent id fails",
    async () => {
      await api.functional.shoppingMall.memberUser.depositCharges.atDepositCharge(
        connection,
        { depositChargeId: nonExistentId },
      );
    },
  );
}
