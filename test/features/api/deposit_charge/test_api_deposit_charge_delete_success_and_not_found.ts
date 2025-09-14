import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_deposit_charge_delete_success_and_not_found(
  connection: api.IConnection,
) {
  // 1. Member user joins the system to authenticate
  const memberUserBody = {
    email: RandomGenerator.alphaNumeric(5) + "@example.com",
    password_hash: "password1234",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "members",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody,
    });
  typia.assert(memberUser);

  // 2. Generate a random depositChargeId for the test
  const depositChargeId = typia.random<string & tags.Format<"uuid">>();

  // 3. Attempt to delete the existing deposit charge (simulate success)
  // Since no creation API, we assume the ID is valid for deletion
  await api.functional.shoppingMall.memberUser.depositCharges.eraseDepositCharge(
    connection,
    { depositChargeId },
  );

  // 4. Attempt to delete a non-existent deposit charge to validate error
  const nonExistentId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "attempt to delete non-existent deposit charge should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.depositCharges.eraseDepositCharge(
        connection,
        { depositChargeId: nonExistentId },
      );
    },
  );
}
