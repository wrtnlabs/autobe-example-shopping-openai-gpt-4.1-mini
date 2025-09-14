import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";

/**
 * Validates that an admin user can successfully update an inventory record.
 *
 * This E2E test covers the full flow:
 *
 * 1. Admin user registration (join)
 * 2. Admin user login
 * 3. Inventory record creation
 * 4. Inventory record update with new option combination code and stock
 *    quantity
 * 5. Validation of updated fields and timestamp format correctness
 *
 * Each step ensures correct API functionality and authorization. API
 * responses are validated with typia.assert to confirm strict type safety.
 * TestValidator asserts field value correctness and timestamp format
 * adherence.
 *
 * This comprehensive test ensures inventory update is properly handled
 * within an authorized admin user context.
 */
export async function test_api_inventory_update_success_admin_user(
  connection: api.IConnection,
) {
  // 1. Admin user registration
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

  // 2. Admin user login
  const adminUserLoginBody = {
    email: adminUserCreateBody.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInAdminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(loggedInAdminUser);

  // 3. Create inventory record
  const inventoryCreateBody = {
    shopping_mall_sale_id: typia.random<string & tags.Format<"uuid">>(),
    option_combination_code: RandomGenerator.alphaNumeric(8),
    stock_quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<0>
    >(),
  } satisfies IShoppingMallInventory.ICreate;

  const createdInventory: IShoppingMallInventory =
    await api.functional.shoppingMall.adminUser.inventory.create(connection, {
      body: inventoryCreateBody,
    });
  typia.assert(createdInventory);

  // 4. Update inventory record
  const inventoryUpdateBody = {
    option_combination_code: RandomGenerator.alphaNumeric(8),
    stock_quantity: Number(
      typia.random<number & tags.Type<"int32"> & tags.Minimum<0>>().toFixed(0),
    ),
  } satisfies IShoppingMallInventory.IUpdate;

  const updatedInventory: IShoppingMallInventory =
    await api.functional.shoppingMall.adminUser.inventory.update(connection, {
      inventoryId: createdInventory.id,
      body: inventoryUpdateBody,
    });
  typia.assert(updatedInventory);

  // 5. Validations
  TestValidator.equals(
    "updated stock_quantity matches",
    updatedInventory.stock_quantity,
    inventoryUpdateBody.stock_quantity,
  );
  TestValidator.equals(
    "updated option_combination_code matches",
    updatedInventory.option_combination_code,
    inventoryUpdateBody.option_combination_code,
  );

  // Validate timestamps are in the correct ISO format
  TestValidator.predicate(
    "created_at is ISO 8601",
    typeof updatedInventory.created_at === "string" &&
      /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.\d+)?Z$/.test(
        updatedInventory.created_at,
      ),
  );

  TestValidator.predicate(
    "updated_at is ISO 8601",
    typeof updatedInventory.updated_at === "string" &&
      /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.\d+)?Z$/.test(
        updatedInventory.updated_at,
      ),
  );

  // deleted_at can be null or undefined
  TestValidator.predicate(
    "deleted_at is null or undefined",
    updatedInventory.deleted_at === null ||
      updatedInventory.deleted_at === undefined,
  );
}
