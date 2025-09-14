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
 * Test fetching a paginated list of sale options with valid pagination and
 * filter parameters.
 *
 * This test simulates a seller user authentication and performs a
 * paginated, filtered fetch of sale options via the PATCH
 * /shoppingMall/sellerUser/saleOptions endpoint. It verifies the response
 * pagination structure and individual sale option summaries conform to
 * expected formats, including UUIDs and ISO date-times.
 *
 * The test ensures the business flow of authenticating a seller user,
 * making a proper paginated listing request, and validating the integrity
 * and correctness of the returned sale option data.
 *
 * Steps:
 *
 * 1. Create and authenticate a new seller user.
 * 2. Send a paginated and filtered search request for sale options.
 * 3. Validate the pagination metadata is positive and correct.
 * 4. Validate each sale option summary's fields for UUID formats, non-empty
 *    strings, and ISO date-time formats.
 */
export async function test_api_seller_sale_options_list_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins to create and authenticate
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Prepare the pagination and search filter request
  const requestBody = {
    page: 1,
    limit: 10,
    search: "option",
    orderBy: null,
  } satisfies IShoppingMallSaleOption.IRequest;

  // 3. Fetch sale options with pagination and search filter
  const saleOptionsPage: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: requestBody,
    });
  typia.assert(saleOptionsPage);

  // 4. Validate pagination values are positive and sensible
  TestValidator.predicate(
    "page number positive",
    saleOptionsPage.pagination.current >= 1,
  );
  TestValidator.predicate(
    "limit positive",
    saleOptionsPage.pagination.limit >= 1,
  );
  TestValidator.predicate(
    "pages non-negative",
    saleOptionsPage.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "records non-negative",
    saleOptionsPage.pagination.records >= 0,
  );

  // 5. Validate each sale option summary
  for (const option of saleOptionsPage.data) {
    typia.assert(option);
    TestValidator.predicate(
      "sale option id is UUID",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        option.id,
      ),
    );
    TestValidator.predicate(
      "sale option group id is UUID",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        option.shopping_mall_sale_option_group_id,
      ),
    );
    TestValidator.predicate(
      "sale option code non-empty",
      option.code.length > 0,
    );
    TestValidator.predicate(
      "sale option name non-empty",
      option.name.length > 0,
    );
    TestValidator.predicate(
      "sale option type non-empty",
      option.type.length > 0,
    );
    TestValidator.predicate(
      "created_at is ISO date-time",
      !isNaN(Date.parse(option.created_at)),
    );
    TestValidator.predicate(
      "updated_at is ISO date-time",
      !isNaN(Date.parse(option.updated_at)),
    );
  }
}
