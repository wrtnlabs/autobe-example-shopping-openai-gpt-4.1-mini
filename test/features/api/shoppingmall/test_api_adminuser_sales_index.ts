import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSale";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";

export async function test_api_adminuser_sales_index(
  connection: api.IConnection,
) {
  // 1. Admin user join with valid create data
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, { body: createBody });
  typia.assert(adminUser);

  // 2. Admin user login using matching credentials
  const loginBody = {
    email: createBody.email,
    password_hash: createBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const loginResponse: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, { body: loginBody });
  typia.assert(loginResponse);

  // 3. Call sales index API endpoint with pagination and filters
  // Construct a realistic filter body
  const filterBody = {
    page: 1,
    limit: 10,
    search: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallSale.IRequest;

  const pageResult: IPageIShoppingMallSale.ISummary =
    await api.functional.shoppingMall.adminUser.sales.index(connection, {
      body: filterBody,
    });
  typia.assert(pageResult);

  // Validate pagination properties
  TestValidator.predicate(
    "pagination includes current page",
    pageResult.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    pageResult.pagination.limit >= 0,
  );
  TestValidator.predicate(
    "pagination pages count positive",
    pageResult.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records is non-negative",
    pageResult.pagination.records >= 0,
  );

  // Validate page data count is no more than limit
  TestValidator.predicate(
    "number of sales is no more than limit",
    pageResult.data.length <= filterBody.limit!,
  );

  // Validate all sales items returned satisfy search criteria
  const seenIds = new Set<string>();
  for (const sale of pageResult.data) {
    typia.assert(sale);
    TestValidator.predicate(
      "sale name includes search keyword",
      sale.name.toLowerCase().includes(filterBody.search!.toLowerCase()),
    );
    TestValidator.equals(
      "sale status matches filter",
      sale.status,
      filterBody.status!,
    );

    // Ensure sale ID uniqueness
    TestValidator.predicate("sale id is unique", !seenIds.has(sale.id));
    seenIds.add(sale.id);
  }
}
