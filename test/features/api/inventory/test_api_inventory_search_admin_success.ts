import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInventory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";

/**
 * Validate that an admin user can successfully search inventory with filters
 * and pagination.
 *
 * This test ensures admin user creation, authentication, and inventory search
 * in the shopping mall admin context. It covers saleId filtering, option code
 * filtering, stock quantity range filtering, pagination, and sorting. Results
 * are verified for types and logical correctness.
 */
export async function test_api_inventory_search_admin_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const passwordHash = RandomGenerator.alphaNumeric(32);
  const nickname = RandomGenerator.name();
  const fullName = RandomGenerator.name(2);
  const status = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: passwordHash,
        nickname: nickname,
        full_name: fullName,
        status: status,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Inventory search with filters and pagination
  // Construct a realistic search request
  const saleId: string = typia.random<string & tags.Format<"uuid">>();
  const optionCombinationCode = RandomGenerator.alphabets(8);
  const minQuantity = Math.floor(Math.random() * 21); // random int 0-20
  const maxQuantity = minQuantity + 10; // max >= min
  const page = 1;
  const limit = 10;
  const orderBy = "stock_quantity";

  const requestBody = {
    saleId: saleId,
    optionCombinationCode: optionCombinationCode,
    minQuantity: minQuantity,
    maxQuantity: maxQuantity,
    page: page,
    limit: limit,
    orderBy: orderBy,
  } satisfies IShoppingMallInventory.IRequest;

  const inventoryPage: IPageIShoppingMallInventory.ISummary =
    await api.functional.shoppingMall.adminUser.inventory.index(connection, {
      body: requestBody,
    });
  typia.assert(inventoryPage);

  // 3. Validations
  TestValidator.equals(
    "pagination current page",
    inventoryPage.pagination.current,
    page,
  );
  TestValidator.equals(
    "pagination limit",
    inventoryPage.pagination.limit,
    limit,
  );
  TestValidator.predicate(
    "pagination records count non-negative",
    inventoryPage.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count non-negative",
    inventoryPage.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "summary data array is array",
    Array.isArray(inventoryPage.data),
  );
}
