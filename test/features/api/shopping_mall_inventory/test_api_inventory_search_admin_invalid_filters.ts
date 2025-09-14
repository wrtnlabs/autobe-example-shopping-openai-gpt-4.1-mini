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
 * Test inventory search endpoint for an authenticated admin user with
 * invalid filter parameters leading to empty or error responses.
 *
 * The test performs the following steps:
 *
 * 1. Register and authenticate a new admin user.
 * 2. Attempt inventory search with a saleId that is unlikely to exists (random
 *    UUID).
 * 3. Attempt inventory search with negative minQuantity and positive
 *    maxQuantity (invalid range).
 * 4. Attempt inventory search with minQuantity greater than maxQuantity
 *    (invalid filter logic).
 * 5. Attempt inventory search with null optionCombinationCode (valid but
 *    should handle gracefully).
 * 6. Validate responses are of the correct type and contain no unexpected
 *    errors.
 * 7. Validate that empty result sets are handled properly.
 */
export async function test_api_inventory_search_admin_invalid_filters(
  connection: api.IConnection,
) {
  // 1. Register and authenticate a new admin user
  const adminBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, { body: adminBody });
  typia.assert(admin);

  // 2. Attempt inventory search with a non-existing saleId (random UUID)
  const searchRequest1 = {
    saleId: typia.random<string & tags.Format<"uuid">>(),
    page: 1,
    limit: 10,
  } satisfies IShoppingMallInventory.IRequest;
  const response1: IPageIShoppingMallInventory.ISummary =
    await api.functional.shoppingMall.adminUser.inventory.index(connection, {
      body: searchRequest1,
    });
  typia.assert(response1);
  TestValidator.equals(
    "pagination.current is 1 for searchRequest1",
    response1.pagination.current,
    1,
  );
  TestValidator.predicate(
    "search with non-existing saleId returns empty data",
    response1.data.length === 0,
  );

  // 3. Attempt inventory search with negative minQuantity and positive maxQuantity
  const searchRequest2 = {
    minQuantity: -10,
    maxQuantity: 100,
    page: 1,
    limit: 10,
  } satisfies IShoppingMallInventory.IRequest;
  const response2: IPageIShoppingMallInventory.ISummary =
    await api.functional.shoppingMall.adminUser.inventory.index(connection, {
      body: searchRequest2,
    });
  typia.assert(response2);
  TestValidator.equals(
    "pagination.current is 1 for searchRequest2",
    response2.pagination.current,
    1,
  );
  // Validate response is normal and data length non-negative
  TestValidator.predicate(
    "search with negative minQuantity handled",
    response2.data.length >= 0,
  );

  // 4. Attempt inventory search with minQuantity greater than maxQuantity
  const searchRequest3 = {
    minQuantity: 50,
    maxQuantity: 10,
    page: 1,
    limit: 10,
  } satisfies IShoppingMallInventory.IRequest;
  // We expect no error, but possibly empty results
  const response3: IPageIShoppingMallInventory.ISummary =
    await api.functional.shoppingMall.adminUser.inventory.index(connection, {
      body: searchRequest3,
    });
  typia.assert(response3);
  TestValidator.equals(
    "pagination.current is 1 for searchRequest3",
    response3.pagination.current,
    1,
  );
  TestValidator.predicate(
    "search with minQuantity greater than maxQuantity returns empty",
    response3.data.length === 0,
  );

  // 5. Attempt inventory search with null optionCombinationCode (should be valid and handled gracefully)
  const searchRequest4 = {
    optionCombinationCode: null,
    page: 1,
    limit: 10,
  } satisfies IShoppingMallInventory.IRequest;
  const response4: IPageIShoppingMallInventory.ISummary =
    await api.functional.shoppingMall.adminUser.inventory.index(connection, {
      body: searchRequest4,
    });
  typia.assert(response4);
  TestValidator.equals(
    "pagination.current is 1 for searchRequest4",
    response4.pagination.current,
    1,
  );
  TestValidator.predicate(
    "search with null optionCombinationCode returns valid response",
    response4.data.length >= 0,
  );
}
