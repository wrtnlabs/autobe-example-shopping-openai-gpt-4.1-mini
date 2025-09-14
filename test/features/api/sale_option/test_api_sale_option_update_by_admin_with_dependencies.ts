import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Test update of an existing sale option by an authenticated admin user.
 *
 * This test function performs the following workflow:
 *
 * 1. Creates an admin user account and authenticates.
 * 2. Creates a sale option group, storing the group ID for dependency.
 * 3. Creates an initial sale option with the created group.
 * 4. Updates the sale option with new data (code, name, type, and optionally group
 *    ID).
 * 5. Validates that the updated sale option matches the update input and
 *    timestamps reflect the change.
 *
 * The test ensures that sale option updates are properly handled with
 * dependencies established.
 */
export async function test_api_sale_option_update_by_admin_with_dependencies(
  connection: api.IConnection,
) {
  // 1. Create an admin user account and authenticate.
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create a sale option group and store its ID.
  const saleOptionGroupCreateBody = {
    code: RandomGenerator.alphaNumeric(4).toUpperCase(),
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

  // 3. Create initial sale option with the created group ID.
  const saleOptionCreateBody = {
    shopping_mall_sale_option_group_id: saleOptionGroup.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    name: RandomGenerator.name(),
    type: RandomGenerator.pick([
      "selection",
      "boolean",
      "text",
      "number",
    ] as const),
  } satisfies IShoppingMallSaleOption.ICreate;

  const initialSaleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.create(connection, {
      body: saleOptionCreateBody,
    });
  typia.assert(initialSaleOption);

  // 4. Prepare update data for the sale option.
  //    Update code, name, type, and optionally shopping_mall_sale_option_group_id.
  const updateBody = {
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    name: RandomGenerator.name(),
    type: RandomGenerator.pick([
      "selection",
      "boolean",
      "text",
      "number",
    ] as const),
    shopping_mall_sale_option_group_id: saleOptionGroup.id,
  } satisfies IShoppingMallSaleOption.IUpdate;

  // 5. Perform the update request.
  const updatedSaleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.adminUser.saleOptions.update(connection, {
      saleOptionId: initialSaleOption.id,
      body: updateBody,
    });
  typia.assert(updatedSaleOption);

  // 6. Validate that updated values match the update input.
  TestValidator.equals(
    "updated sale option id matches initial",
    updatedSaleOption.id,
    initialSaleOption.id,
  );
  TestValidator.equals(
    "updated sale option code matches update",
    updatedSaleOption.code,
    updateBody.code,
  );
  TestValidator.equals(
    "updated sale option name matches update",
    updatedSaleOption.name,
    updateBody.name,
  );
  TestValidator.equals(
    "updated sale option type matches update",
    updatedSaleOption.type,
    updateBody.type,
  );
  TestValidator.equals(
    "updated sale option group id matches update",
    updatedSaleOption.shopping_mall_sale_option_group_id,
    updateBody.shopping_mall_sale_option_group_id,
  );

  // 7. Validate that timestamps are updated appropriately.
  //    updated_at should be later than or equal to created_at, and created_at unchanged from initial.
  TestValidator.predicate(
    "updated_at is greater or equal to created_at",
    new Date(updatedSaleOption.updated_at) >=
      new Date(updatedSaleOption.created_at),
  );
  TestValidator.equals(
    "created_at matches initial created_at",
    updatedSaleOption.created_at,
    initialSaleOption.created_at,
  );

  // 8. Optional: deleted_at should be null or undefined (no deletion in update).
  TestValidator.predicate(
    "deleted_at is null or undefined",
    updatedSaleOption.deleted_at === null ||
      updatedSaleOption.deleted_at === undefined,
  );
}
