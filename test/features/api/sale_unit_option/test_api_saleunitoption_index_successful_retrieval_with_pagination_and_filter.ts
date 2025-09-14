import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleUnitOption";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";

/**
 * Test the successful retrieval of sale unit options for a given sale unit
 * with pagination and filtering.
 *
 * Business Context:
 *
 * - Sale unit options are configurations linked to sale units.
 * - Admin users must be authorized to retrieve these options.
 * - This test validates both the authorization process and the correct
 *   response structure.
 *
 * Steps:
 *
 * 1. Create an admin user by calling the /auth/adminUser/join endpoint.
 * 2. Login as the created admin user through /auth/adminUser/login endpoint.
 * 3. Use the authorized admin user context to call the PATCH
 *    /shoppingMall/adminUser/sales/{saleId}/saleUnits/{saleUnitId}/saleUnitOptions
 *    endpoint.
 * 4. Provide pagination and filter parameters in the request body.
 * 5. Validate the returned data list and pagination info.
 * 6. Confirm every returned sale unit option contains valid IDs, prices, stock
 *    quantities, and timestamps.
 *
 * This test ensures that the admin user authorization is enforced and that
 * the API returns properly filtered, paginated sale unit options with
 * accurate details.
 */
export async function test_api_saleunitoption_index_successful_retrieval_with_pagination_and_filter(
  connection: api.IConnection,
) {
  // 1. Create an admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `${RandomGenerator.alphaNumeric(10)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Login as the created admin user
  const adminLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminUser.email,
        password_hash: adminUser.password_hash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(adminLogin);

  // 3. Prepare pagination and filter request body
  const requestBody = {
    page: 1,
    limit: 10,
    saleOptionId: null,
    saleUnitId: null,
  } satisfies IShoppingMallSaleUnitOption.IRequest;

  // 4. Call the endpoint with some random UUIDs for saleId and saleUnitId
  const saleId = typia.random<string & tags.Format<"uuid">>();
  const saleUnitId = typia.random<string & tags.Format<"uuid">>();

  const response: IPageIShoppingMallSaleUnitOption.ISummary =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.index(
      connection,
      {
        saleId,
        saleUnitId,
        body: requestBody,
      },
    );

  // 5. Validate response schema
  typia.assert(response);

  // 6. Validate pagination data
  TestValidator.predicate(
    "pagination.current greater than zero",
    response.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination.limit greater than zero",
    response.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination.pages greater than zero",
    response.pagination.pages > 0,
  );
  TestValidator.predicate(
    "pagination.records greater or equal zero",
    response.pagination.records >= 0,
  );

  // 7. Validate each sale unit option summary in data
  for (const option of response.data) {
    typia.assert<IShoppingMallSaleUnitOption.ISummary>(option);
    // UUID format validated by typia.assert, additional predicate checks for visual confirmation
    TestValidator.predicate(
      "option id is valid UUID format",
      /^[0-9a-fA-F-]{36}$/.test(option.id),
    );
    TestValidator.predicate(
      "shopping_mall_sale_unit_id is valid UUID format",
      /^[0-9a-fA-F-]{36}$/.test(option.shopping_mall_sale_unit_id),
    );
    TestValidator.predicate(
      "shopping_mall_sale_option_id is valid UUID format",
      /^[0-9a-fA-F-]{36}$/.test(option.shopping_mall_sale_option_id),
    );
    TestValidator.predicate(
      "additional_price is finite number",
      Number.isFinite(option.additional_price),
    );
    TestValidator.predicate(
      "stock_quantity is integer and >= 0",
      Number.isInteger(option.stock_quantity) && option.stock_quantity >= 0,
    );
    TestValidator.predicate(
      "created_at is valid date-time format",
      !isNaN(Date.parse(option.created_at)),
    );
    TestValidator.predicate(
      "updated_at is valid date-time format",
      !isNaN(Date.parse(option.updated_at)),
    );
  }
}
