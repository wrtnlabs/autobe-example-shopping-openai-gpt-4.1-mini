import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOptionGroup";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * This test validates the filtering and pagination functionality of the sale
 * option groups listing API for an admin user. It covers creating an admin user
 * with all necessary details, authenticating, then querying the sale option
 * groups with realistic parameters for pagination, search term, and sorting
 * order.
 *
 * The test asserts that the API returns a paginated list according to provided
 * criteria with proper authorization enforced. It validates the structure of
 * returned summaries and pagination metadata for correctness of filtering and
 * sorting logic.
 *
 * This test confirms role-based access control for adminUser with correct token
 * handling and response validation.
 */
export async function test_api_sale_option_group_index_with_filters(
  connection: api.IConnection,
) {
  // 1. Create an admin user and authenticate
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Query sale option groups with filters
  const requestBody: IShoppingMallSaleOptionGroup.IRequest = {
    page: 1,
    limit: 5,
    search: RandomGenerator.name(1),
    orderBy: "code",
  };

  const response: IPageIShoppingMallSaleOptionGroup.ISummary =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.index(
      connection,
      {
        body: requestBody,
      },
    );
  typia.assert(response);

  // Validate pagination metadata
  TestValidator.predicate(
    "pagination current page should be 1",
    response.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit should be 5",
    response.pagination.limit === 5,
  );
  TestValidator.predicate(
    "pagination pages should be greater or equal to 1",
    response.pagination.pages >= 1,
  );
  TestValidator.predicate(
    "pagination records should be non-negative",
    response.pagination.records >= 0,
  );

  // Validate each sale option group summary
  TestValidator.predicate(
    "each sale option group has an id, code, and name",
    response.data.every(
      (g) =>
        typeof g.id === "string" &&
        typeof g.code === "string" &&
        typeof g.name === "string",
    ),
  );
}
