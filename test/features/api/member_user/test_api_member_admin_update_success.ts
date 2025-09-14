import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_member_admin_update_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUserPayload = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: adminUserPayload,
  });
  typia.assert(adminUser);

  // 2. Create and authenticate member user
  const memberUserPayload = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUserAuthorized = await api.functional.auth.memberUser.join(
    connection,
    { body: memberUserPayload },
  );
  typia.assert(memberUserAuthorized);

  // 3. Admin user updates member user details
  // Prepare update payload with modified fields
  const updatedNickname = RandomGenerator.name(2);
  const updatedFullName = RandomGenerator.name(3);
  const updatedPhoneNumber = RandomGenerator.mobile();
  const updatedEmail = typia.random<string & tags.Format<"email">>();

  const memberUserUpdatePayload = {
    email: updatedEmail,
    nickname: updatedNickname,
    full_name: updatedFullName,
    phone_number: updatedPhoneNumber,
    status: "active",
  } satisfies IShoppingMallMemberUser.IUpdate;

  const updatedMemberUser =
    await api.functional.shoppingMall.adminUser.memberUsers.update(connection, {
      id: memberUserAuthorized.id,
      body: memberUserUpdatePayload,
    });
  typia.assert(updatedMemberUser);

  // 4. Validate response fields against update payload
  TestValidator.equals("updated email", updatedMemberUser.email, updatedEmail);
  TestValidator.equals(
    "updated nickname",
    updatedMemberUser.nickname,
    updatedNickname,
  );
  TestValidator.equals(
    "updated full name",
    updatedMemberUser.full_name,
    updatedFullName,
  );
  TestValidator.equals(
    "updated phone number",
    updatedMemberUser.phone_number ?? null,
    updatedPhoneNumber ?? null,
  );
  TestValidator.equals("updated status", updatedMemberUser.status, "active");
}
