import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";

/**
 * Test retrieval of detailed sale unit option information for a valid admin
 * user.
 *
 * This test verifies the successful fetch of sale unit option details by an
 * authenticated adminUser. It also tests failure scenarios including
 * unauthorized access and not found errors.
 *
 * Steps:
 *
 * 1. Create and authenticate an admin user via /auth/adminUser/join.
 * 2. Retrieve sale unit option details with valid UUIDs and valid admin
 *    authentication.
 * 3. Validate response fields match the requested IDs and have proper types.
 * 4. Test unauthorized access by calling the API without authorization header.
 * 5. Test unauthorized access by calling the API with an invalid authorization
 *    token.
 * 6. Test 404 not found error by using a non-existent saleUnitOptionId.
 *
 * All UUIDs are generated randomly and valid. Responses are validated by
 * typia.assert.
 *
 * Business rules enforced by validating error cases and correct data
 * retrieval.
 */
export async function test_api_sales_sale_unit_option_details_admin_success_unauthorized_not_found(
  connection: api.IConnection,
) {
  // 1. Admin user registers and obtains authentication token
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: "$2b$10$abcdefghijklmnopqrstuvxyz0123456789ABCDEFghi", // realistic hash
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Retrieve sale unit option details with valid UUIDs
  const saleId = typia.random<string & tags.Format<"uuid">>();
  const saleUnitId = typia.random<string & tags.Format<"uuid">>();
  const saleUnitOptionId = typia.random<string & tags.Format<"uuid">>();

  const saleUnitOption: IShoppingMallSaleUnitOption =
    await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.at(
      connection,
      {
        saleId,
        saleUnitId,
        saleUnitOptionId,
      },
    );
  typia.assert(saleUnitOption);

  // Validate important fields of the response
  TestValidator.equals(
    "saleUnitOption.shopping_mall_sale_unit_id matches saleUnitId",
    saleUnitOption.shopping_mall_sale_unit_id,
    saleUnitId,
  );
  TestValidator.equals(
    "saleUnitOption.id matches saleUnitOptionId",
    saleUnitOption.id,
    saleUnitOptionId,
  );
  TestValidator.predicate(
    "saleUnitOption.shopping_mall_sale_option_id is UUID string",
    typeof saleUnitOption.shopping_mall_sale_option_id === "string" &&
      /^[0-9a-fA-F-]{36}$/.test(saleUnitOption.shopping_mall_sale_option_id),
  );
  TestValidator.predicate(
    "saleUnitOption.additional_price is number",
    typeof saleUnitOption.additional_price === "number",
  );
  TestValidator.predicate(
    "saleUnitOption.stock_quantity is number",
    typeof saleUnitOption.stock_quantity === "number",
  );
  TestValidator.predicate(
    "saleUnitOption.created_at is valid string",
    typeof saleUnitOption.created_at === "string",
  );
  TestValidator.predicate(
    "saleUnitOption.updated_at is valid string",
    typeof saleUnitOption.updated_at === "string",
  );

  // 3. Unauthorized access - missing Authorization header
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthorized access fails without token",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.at(
        unauthConn,
        {
          saleId,
          saleUnitId,
          saleUnitOptionId,
        },
      );
    },
  );

  // 4. Unauthorized access - invalid Authorization token
  const invalidAuthConn: api.IConnection = {
    ...connection,
    headers: { Authorization: "Bearer invalid_token" },
  };
  await TestValidator.error(
    "unauthorized access fails with invalid token",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.at(
        invalidAuthConn,
        {
          saleId,
          saleUnitId,
          saleUnitOptionId,
        },
      );
    },
  );

  // 5. Not found error with non-existent saleUnitOptionId
  const nonExistentOptionId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "not found error for non-existent saleUnitOptionId",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.saleUnits.saleUnitOptions.at(
        connection,
        {
          saleId,
          saleUnitId,
          saleUnitOptionId: nonExistentOptionId,
        },
      );
    },
  );
}
