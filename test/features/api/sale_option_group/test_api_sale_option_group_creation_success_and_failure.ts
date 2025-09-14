import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

export async function test_api_sale_option_group_creation_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Admin user joins - create admin and get auth
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Successful creation of sale option group
  const saleOptionGroupCreateBody1 = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(2),
  } satisfies IShoppingMallSaleOptionGroup.ICreate;

  const createdGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: saleOptionGroupCreateBody1,
      },
    );
  typia.assert(createdGroup);
  TestValidator.equals(
    "created group code matches",
    createdGroup.code,
    saleOptionGroupCreateBody1.code,
  );
  TestValidator.equals(
    "created group name matches",
    createdGroup.name,
    saleOptionGroupCreateBody1.name,
  );

  // 3. Attempt to create sale option group with duplicate code - should error
  const saleOptionGroupCreateBodyDuplicate = {
    code: saleOptionGroupCreateBody1.code,
    name: RandomGenerator.name(2), // different name but same code
  } satisfies IShoppingMallSaleOptionGroup.ICreate;

  await TestValidator.error(
    "duplicate sale option group code throws error",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
        connection,
        {
          body: saleOptionGroupCreateBodyDuplicate,
        },
      );
    },
  );

  // 4. Unauthorized attempt - using a new connection without authentication
  const unauthenticatedConn: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthorized creation attempt throws error",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
        unauthenticatedConn,
        {
          body: {
            code: RandomGenerator.alphaNumeric(8),
            name: RandomGenerator.name(2),
          } satisfies IShoppingMallSaleOptionGroup.ICreate,
        },
      );
    },
  );
}
