import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Update an existing sale option group with valid data, changing the code and
 * name of the option group. Verify the update succeeds when performed by an
 * admin user with proper authentication.
 */
export async function test_api_sale_option_group_update_valid_admin(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminCreate: IShoppingMallAdminUser.ICreate = {
    email: adminEmail,
    password_hash: "hashed_password_example",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  };

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreate,
    });
  typia.assert(adminUser);

  // 2. Prepare update payload
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  const updateBody: IShoppingMallSaleOptionGroup.IUpdate = {
    code: RandomGenerator.paragraph({ sentences: 2, wordMin: 3, wordMax: 6 }),
    name: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
  };

  // 3. Perform update
  const updatedGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
      connection,
      {
        saleOptionGroupId: saleOptionGroupId,
        body: updateBody,
      },
    );
  typia.assert(updatedGroup);

  // 4. Validate the update result
  TestValidator.equals(
    "updated sale option group id",
    updatedGroup.id,
    saleOptionGroupId,
  );

  TestValidator.equals(
    "updated code matches",
    updatedGroup.code,
    updateBody.code,
  );

  TestValidator.equals(
    "updated name matches",
    updatedGroup.name,
    updateBody.name,
  );
}
