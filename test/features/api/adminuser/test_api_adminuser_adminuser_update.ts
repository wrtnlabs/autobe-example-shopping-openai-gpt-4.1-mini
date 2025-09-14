import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

export async function test_api_adminuser_adminuser_update(
  connection: api.IConnection,
) {
  // 1. Create admin user account
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const createdAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, { body: createBody });
  typia.assert(createdAdmin);

  // 2. Login as created admin user
  const loginBody = {
    email: createBody.email,
    password_hash: createBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, { body: loginBody });
  typia.assert(loggedInAdmin);

  // 3. Prepare update payload
  const updateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.IUpdate;

  // 4. Execute update
  const updatedAdmin: IShoppingMallAdminUser =
    await api.functional.shoppingMall.adminUser.adminUsers.update(connection, {
      id: createdAdmin.id,
      body: updateBody,
    });
  typia.assert(updatedAdmin);

  // 5. Verify update
  TestValidator.equals(
    "updated email matches",
    updatedAdmin.email,
    updateBody.email,
  );
  TestValidator.equals(
    "updated nickname matches",
    updatedAdmin.nickname,
    updateBody.nickname,
  );
  TestValidator.equals(
    "updated full_name matches",
    updatedAdmin.full_name,
    updateBody.full_name,
  );
  TestValidator.equals(
    "updated status matches",
    updatedAdmin.status,
    updateBody.status,
  );
}
