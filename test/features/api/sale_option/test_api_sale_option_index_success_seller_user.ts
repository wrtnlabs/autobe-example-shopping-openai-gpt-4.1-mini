import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOption";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Perform a complete End-to-End (E2E) test to verify that a seller user can
 * retrieve their sale options with filter, pagination, and sorting
 * applied.
 *
 * The test flow includes:
 *
 * 1. Seller user registration (join) using valid randomized credentials.
 * 2. Authentication of the seller user (login).
 * 3. Retrieving the sale options list with various search criteria:
 *
 *    - Basic retrieval with default filters
 *    - Using search keyword filtering
 *    - Applying pagination parameters page and limit
 *    - Applying orderBy sorting in ascending and descending order
 *
 * Each step will validate the response objects using typia.assert to ensure
 * full type safety.
 *
 * This ensures that the sale option listing mechanism works correctly for
 * authenticated seller users and respects filtering, pagination, and
 * sorting rules.
 */
export async function test_api_sale_option_index_success_seller_user(
  connection: api.IConnection,
) {
  // 1. Register a new seller user with random valid data
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "ValidPass123!", // Using a fixed valid password for test
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Login with the seller user's credentials
  const sellerLoginBody = {
    email: sellerCreateBody.email,
    password: sellerCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const loggedInSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(loggedInSeller);

  // 3. Perform sale options list retrieval with empty/default filters
  const defaultRequestBody = {} satisfies IShoppingMallSaleOption.IRequest;

  const defaultOutput: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: defaultRequestBody,
    });
  typia.assert(defaultOutput);
  // Validate pagination properties
  TestValidator.predicate(
    "pagination has valid current page",
    typeof defaultOutput.pagination.current === "number" &&
      defaultOutput.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination has valid limit",
    typeof defaultOutput.pagination.limit === "number" &&
      defaultOutput.pagination.limit >= 0,
  );
  // Validate data array is array
  TestValidator.predicate("data is array", Array.isArray(defaultOutput.data));

  // 4. Perform sale options list with a search keyword filter
  // Use a substring of a random sale option name if available, otherwise random string
  let searchKeyword: string | null = null;
  if (defaultOutput.data.length > 0) {
    searchKeyword = defaultOutput.data[0].name.substring(
      0,
      Math.min(3, defaultOutput.data[0].name.length),
    );
  } else {
    searchKeyword = RandomGenerator.alphabets(3);
  }

  const searchRequestBody = {
    search: searchKeyword,
  } satisfies IShoppingMallSaleOption.IRequest;

  const searchOutput: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: searchRequestBody,
    });
  typia.assert(searchOutput);
  // Validate that all returned sale option names contain the search keyword (case insensitive)
  for (const summary of searchOutput.data) {
    TestValidator.predicate(
      `sale option name contains search keyword [${searchKeyword!}]`,
      summary.name.toLowerCase().includes(searchKeyword!.toLowerCase()),
    );
  }

  // 5. Perform sale options list retrieval with pagination
  const paginationRequestBody = {
    page: 1,
    limit: 2,
  } satisfies IShoppingMallSaleOption.IRequest;

  const paginationOutput: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: paginationRequestBody,
    });
  typia.assert(paginationOutput);
  TestValidator.equals(
    "pagination current page is 1",
    paginationOutput.pagination.current,
    1,
  );
  TestValidator.equals(
    "pagination limit is 2",
    paginationOutput.pagination.limit,
    2,
  );
  TestValidator.predicate(
    "data count less or equal to limit",
    paginationOutput.data.length <= 2,
  );

  // 6. Perform sale options list retrieval with orderBy ascending by name
  const orderByAscRequestBody = {
    orderBy: "name",
  } satisfies IShoppingMallSaleOption.IRequest;

  const orderByAscOutput: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: orderByAscRequestBody,
    });
  typia.assert(orderByAscOutput);
  for (let i = 1; i < orderByAscOutput.data.length; i++) {
    TestValidator.predicate(
      `orderBy ascending name check for index ${i}`,
      orderByAscOutput.data[i - 1].name.localeCompare(
        orderByAscOutput.data[i].name,
      ) <= 0,
    );
  }

  // 7. Perform sale options list retrieval with orderBy descending by name
  const orderByDescRequestBody = {
    orderBy: "-name",
  } satisfies IShoppingMallSaleOption.IRequest;

  const orderByDescOutput: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: orderByDescRequestBody,
    });
  typia.assert(orderByDescOutput);
  for (let i = 1; i < orderByDescOutput.data.length; i++) {
    TestValidator.predicate(
      `orderBy descending name check for index ${i}`,
      orderByDescOutput.data[i - 1].name.localeCompare(
        orderByDescOutput.data[i].name,
      ) >= 0,
    );
  }
}
