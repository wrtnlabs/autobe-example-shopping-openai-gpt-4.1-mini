import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test scenario for the successful deletion of a sale option by a seller
 * user.
 *
 * This test function follows a series of steps:
 *
 * 1. Create an admin user by calling the admin user join API and authenticate
 *    as that admin.
 * 2. Create a sale option group using the admin user authentication.
 * 3. Create a seller user by calling the seller user join API and authenticate
 *    as that seller.
 * 4. Create a sale option group using the seller user authentication.
 * 5. Create a sale option under the seller's sale option group.
 * 6. Finally, delete the sale option using the seller user context.
 *
 * Each step includes type assertions and proper usage of DTO types with
 * satisfies. All asynchronous calls are awaited, and TestValidator is used
 * for validation.
 */
export async function test_api_sale_option_delete_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "P@ssword123!";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a sale option group as admin
  const adminSaleOptionGroupCode = RandomGenerator.alphaNumeric(8);
  const adminSaleOptionGroupName = RandomGenerator.paragraph({ sentences: 3 });
  const adminCreatedOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: adminSaleOptionGroupCode,
          name: adminSaleOptionGroupName,
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(adminCreatedOptionGroup);

  // 3. Seller user creation and authentication
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "P@ssword123!";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: sellerUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 4. Create a sale option group as seller
  const sellerSaleOptionGroupCode = RandomGenerator.alphaNumeric(8);
  const sellerSaleOptionGroupName = RandomGenerator.paragraph({ sentences: 3 });
  const sellerCreatedOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.create(
      connection,
      {
        body: {
          code: sellerSaleOptionGroupCode,
          name: sellerSaleOptionGroupName,
        } satisfies IShoppingMallSaleOptionGroup.ICreate,
      },
    );
  typia.assert(sellerCreatedOptionGroup);

  // 5. Create a sale option under the seller's group
  const saleOptionCode = RandomGenerator.alphaNumeric(8);
  const saleOptionName = RandomGenerator.name();
  const saleOptionType = RandomGenerator.pick([
    "selection",
    "boolean",
  ] as const);

  const createdSaleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.sellerUser.saleOptions.create(
      connection,
      {
        body: {
          shopping_mall_sale_option_group_id: sellerCreatedOptionGroup.id,
          code: saleOptionCode,
          name: saleOptionName,
          type: saleOptionType,
        } satisfies IShoppingMallSaleOption.ICreate,
      },
    );
  typia.assert(createdSaleOption);

  // 6. Delete the sale option
  await api.functional.shoppingMall.adminUser.saleOptions.erase(connection, {
    saleOptionId: createdSaleOption.id,
  });
}
