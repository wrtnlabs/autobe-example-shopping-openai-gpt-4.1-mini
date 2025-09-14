import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOptionGroup";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates that a seller user can join (authenticate) and then query
 * the sale option groups list with pagination and optional search/filter
 * criteria. It ensures correct authorization for the sellerUser role, proper
 * handling of request and response types, and that the sales option groups list
 * is returned following the pagination structure defined by the
 * IPageIShoppingMallSaleOptionGroup.ISummary type. The test includes steps:
 *
 * 1. Seller user joins the system by executing the join API.
 * 2. Validate the returned authorized seller user with tokens.
 * 3. Use the authorized seller to call the saleOptionGroups index API with sample
 *    pagination and search parameters.
 * 4. Validate the response object structure complies with expected paginated
 *    summaries.
 * 5. Verify business rules: response contains pagination info, data items with id,
 *    code, and name.
 * 6. Test boundary conditions like empty search, default pagination values, and
 *    typical query parameters.
 */
export async function test_api_sale_option_group_index_for_seller(
  connection: api.IConnection,
) {
  // 1. Seller user joins (registers/authenticates)
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    full_name: RandomGenerator.name(),
    nickname: RandomGenerator.name(),
    password: "P@ssword123!",
    business_registration_number: RandomGenerator.alphaNumeric(10),
    phone_number: RandomGenerator.mobile(),
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller = await api.functional.auth.sellerUser.join(connection, {
    body: sellerCreateBody,
  });
  typia.assert(seller);

  // 2. Call saleOptionGroups index endpoint with a typical pagination and search request
  const requestBody = {
    search: RandomGenerator.substring("Sample Option Group"),
    page: 1,
    limit: 10,
    orderBy: "name ASC",
  } satisfies IShoppingMallSaleOptionGroup.IRequest;

  const response =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.index(
      connection,
      {
        body: requestBody,
      },
    );
  typia.assert(response);

  // 3. Validate pagination information
  TestValidator.predicate(
    "pagination current page is positive",
    response.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    response.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination pages is positive or zero",
    response.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records is non-negative",
    response.pagination.records >= 0,
  );

  // 4. Validate each data item has required fields and correct format
  for (const item of response.data) {
    TestValidator.predicate(
      "item id is uuid format",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        item.id,
      ),
    );
    TestValidator.predicate(
      "item code is non-empty string",
      typeof item.code === "string" && item.code.length > 0,
    );
    TestValidator.predicate(
      "item name is non-empty string",
      typeof item.name === "string" && item.name.length > 0,
    );
  }

  // 5. Also test an empty filter returns valid pagination and data array
  const emptyFilterResponse =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.index(
      connection,
      {
        body: {
          search: null,
          page: 1,
          limit: 5,
          orderBy: null,
        } satisfies IShoppingMallSaleOptionGroup.IRequest,
      },
    );
  typia.assert(emptyFilterResponse);
  TestValidator.predicate(
    "pagination current page is 1",
    emptyFilterResponse.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 5",
    emptyFilterResponse.pagination.limit === 5,
  );
  TestValidator.predicate(
    "response data is array",
    Array.isArray(emptyFilterResponse.data),
  );
  // response.data can be empty if no records
}
