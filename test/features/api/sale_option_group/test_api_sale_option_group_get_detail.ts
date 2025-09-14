import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Validate the retrieval of detailed information of a sale option group by
 * ID.
 *
 * This test covers the entire workflow for an admin user:
 *
 * 1. Create an admin user and authenticate.
 * 2. Create a new sale option group with a unique code and name.
 * 3. Retrieve the sale option group detail by its UUID and validate response
 *    data.
 * 4. Attempt to retrieve a non-existent sale option group and verify error
 *    handling.
 *
 * It ensures strict role-based authorization and accurate data retrieval.
 */
export async function test_api_sale_option_group_get_detail(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
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

  // 2. Create sale option group
  const groupCode = RandomGenerator.alphaNumeric(8);
  const groupName = RandomGenerator.name(2);
  const saleOptionGroupCreateBody = {
    code: groupCode,
    name: groupName,
  } satisfies IShoppingMallSaleOptionGroup.ICreate;
  const createdGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: saleOptionGroupCreateBody,
      },
    );
  typia.assert(createdGroup);

  // 3. Retrieve detail by ID
  const retrievedGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.at(
      connection,
      {
        saleOptionGroupId: createdGroup.id,
      },
    );
  typia.assert(retrievedGroup);
  TestValidator.equals(
    "retrieved group id matches created id",
    retrievedGroup.id,
    createdGroup.id,
  );
  TestValidator.equals(
    "retrieved group code matches created code",
    retrievedGroup.code,
    createdGroup.code,
  );
  TestValidator.equals(
    "retrieved group name matches created name",
    retrievedGroup.name,
    createdGroup.name,
  );

  // 4. Attempt to retrieve a non-existent group and verify error
  const invalidId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "retrieving non-existent sale option group should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.at(
        connection,
        { saleOptionGroupId: invalidId },
      );
    },
  );
}
