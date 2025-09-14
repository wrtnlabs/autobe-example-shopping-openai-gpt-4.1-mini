import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Test successful creation of a new sale option by an authenticated admin
 * user.
 *
 * This test verifies the entire workflow starting from admin user join,
 * creation of sale option group, and finally creating a sale option under
 * the created group with the admin context.
 *
 * Steps:
 *
 * 1. Admin user joins (registers) and gains authentication token
 * 2. Create a new sale option group with unique code and name
 * 3. Create a new sale option with valid group ID, code, name, and type
 * 4. Validate the returned sale option to ensure all required fields exist and
 *    the relationship is consistent.
 *
 * This test ensures the authorization is correctly enforced, and data
 * integrity is maintained.
 */
export async function test_api_sale_option_creation_with_valid_admin_authentication(
  connection: api.IConnection,
) {
  // 1. Admin user joins to obtain authentication
  const adminCreateBody = {
    email: `admin_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 2. Create sale option group
  const saleOptionGroupCreateBody = {
    code: `group_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(),
  } satisfies IShoppingMallSaleOptionGroup.ICreate;

  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.create(
      connection,
      {
        body: saleOptionGroupCreateBody,
      },
    );
  typia.assert(saleOptionGroup);

  // 3. Create sale option with valid group ID
  const saleOptionCreateBody = {
    shopping_mall_sale_option_group_id: saleOptionGroup.id,
    code: `option_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(),
    type: "selection",
  } satisfies IShoppingMallSaleOption.ICreate;

  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: saleOptionCreateBody,
    });
  typia.assert(saleOption);

  // 4. Validate returned sale option
  TestValidator.predicate(
    "sale option ID is valid uuid",
    typeof saleOption.id === "string" && saleOption.id.length === 36,
  );
  TestValidator.equals(
    "sale option group ID matches",
    saleOption.shopping_mall_sale_option_group_id,
    saleOptionGroup.id,
  );
  TestValidator.equals(
    "sale option code matches",
    saleOption.code,
    saleOptionCreateBody.code,
  );
  TestValidator.equals(
    "sale option name matches",
    saleOption.name,
    saleOptionCreateBody.name,
  );
  TestValidator.equals(
    "sale option type matches",
    saleOption.type,
    saleOptionCreateBody.type,
  );
  TestValidator.predicate(
    "sale option created_at is valid date-time",
    typeof saleOption.created_at === "string" &&
      saleOption.created_at.length > 0,
  );
  TestValidator.predicate(
    "sale option updated_at is valid date-time",
    typeof saleOption.updated_at === "string" &&
      saleOption.updated_at.length > 0,
  );
  TestValidator.predicate(
    "sale option deleted_at is null or undefined",
    saleOption.deleted_at === null || saleOption.deleted_at === undefined,
  );
}
