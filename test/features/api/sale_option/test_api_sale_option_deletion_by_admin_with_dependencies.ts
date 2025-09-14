import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * E2E test verifying the deletion of a sale option by an authenticated
 * admin user.
 *
 * This test performs the entire necessary workflow:
 *
 * 1. Admin user registration and authentication.
 * 2. Creation of a sale option group.
 * 3. Creation of a sale option belonging to that group.
 * 4. Deletion of the created sale option.
 * 5. Verification that the sale option is no longer accessible by expecting an
 *    error when trying to delete it again.
 *
 * All API calls are awaited, responses type-asserted via typia, and
 * requests use satisfies for DTO types. Random realistic values are
 * generated for all required fields.
 */
export async function test_api_sale_option_deletion_by_admin_with_dependencies(
  connection: api.IConnection,
) {
  // 1. Admin user join and authenticate
  const adminUserEmail: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminUserEmail,
      password_hash: RandomGenerator.alphaNumeric(12),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Create sale option group
  const optionGroupCode = RandomGenerator.alphaNumeric(8);
  const optionGroupName = RandomGenerator.name(3);
  const saleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: optionGroupCode,
          name: optionGroupName,
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(saleOptionGroup);

  // 3. Create sale option (dependent on option group)
  const saleOptionCode = RandomGenerator.alphaNumeric(8);
  const saleOptionName = RandomGenerator.name(3);
  const saleOptionType = "selection";
  const saleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: {
        shopping_mall_sale_option_group_id: saleOptionGroup.id,
        code: saleOptionCode,
        name: saleOptionName,
        type: saleOptionType,
      } satisfies IShoppingMallSaleOption.ICreate,
    });
  typia.assert(saleOption);

  // 4. Delete the created sale option
  await api.functional.shoppingMall.adminUser.saleOptions.erase(connection, {
    saleOptionId: saleOption.id,
  });

  // 5. Verify the sale option is no longer accessible (fetch attempt expects error)
  await TestValidator.error(
    "deleted sale option should not be accessible",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptions.erase(
        connection,
        {
          saleOptionId: saleOption.id,
        },
      );
    },
  );
}
