import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOption";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";

/**
 * Test successful retrieval of the sale options list as an admin user.
 *
 * This test validates the entire flow of an admin user joining the system,
 * authenticating, and retrieving a paginated and filtered list of sale
 * options from the admin endpoint.
 *
 * Steps:
 *
 * 1. Admin user creation with randomized but valid data.
 * 2. Admin user authentication via login.
 * 3. Preparing and sending a valid sale options search request with pagination
 *    and search filters.
 * 4. Asserting that the response contains correct pagination metadata.
 * 5. Verifying that each returned sale option summary conforms to expected
 *    properties including UUID format for IDs and non-empty strings for
 *    code, name, and type.
 *
 * The test maintains strict type safety, uses typia for runtime type
 * assertions, and uses TestValidator for business rule validations.
 * Authentication tokens are managed internally by the SDK, and headers are
 * not manipulated directly.
 */
export async function test_api_sale_option_index_success_admin_user(
  connection: api.IConnection,
) {
  // 1. Create an admin user and authenticate
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Switch authentication context to existing admin user via login
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminAuth: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminAuth);

  // 3. Prepare request body with valid pagination and filter parameters
  const requestBody: IShoppingMallSaleOption.IRequest = {
    page: 1,
    limit: 10,
    search: RandomGenerator.name(), // random string as search filter
    orderBy: "code",
  };

  // 4. Call sale option index endpoint
  const response: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.adminUser.saleOptions.index(connection, {
      body: requestBody,
    });
  typia.assert(response);

  // 5. Validate pagination properties
  TestValidator.predicate(
    "pagination current is a positive integer",
    Number.isInteger(response.pagination.current) &&
      response.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit is a positive integer",
    Number.isInteger(response.pagination.limit) &&
      response.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination records is a non-negative integer",
    Number.isInteger(response.pagination.records) &&
      response.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages is a positive integer",
    Number.isInteger(response.pagination.pages) &&
      response.pagination.pages > 0,
  );

  // 6. Validate data array and properties
  TestValidator.predicate("data is an array", Array.isArray(response.data));

  for (const option of response.data) {
    typia.assert(option);
    TestValidator.predicate(
      `sale option id is valid uuid: ${option.id}`,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        option.id,
      ),
    );
    TestValidator.predicate(
      `sale option code is string: ${option.code}`,
      typeof option.code === "string" && option.code.length > 0,
    );
    TestValidator.predicate(
      `sale option name is string: ${option.name}`,
      typeof option.name === "string" && option.name.length > 0,
    );
    TestValidator.predicate(
      `sale option type is string: ${option.type}`,
      typeof option.type === "string" && option.type.length > 0,
    );
  }
}
