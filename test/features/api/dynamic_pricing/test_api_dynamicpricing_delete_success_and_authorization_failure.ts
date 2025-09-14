import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

export async function test_api_dynamicpricing_delete_success_and_authorization_failure(
  connection: api.IConnection,
) {
  // 1. Create and authenticate an admin user via join API
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Authenticate again with login API to validate session/token
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loginUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(loginUser);

  // 3. Successfully delete a dynamic pricing record
  const dynamicPricingId = typia.random<string & tags.Format<"uuid">>();
  await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
    connection,
    {
      dynamicPricingId,
    },
  );

  // 4. Try deleting the same record again, expecting error (non-existent)
  await TestValidator.error(
    "delete non-existent dynamicPricingId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
        connection,
        {
          dynamicPricingId,
        },
      );
    },
  );

  // 5. Attempt delete without authorization (unauthenticated connection)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "delete without authorization should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
        unauthenticatedConnection,
        { dynamicPricingId: typia.random<string & tags.Format<"uuid">>() },
      );
    },
  );
}
