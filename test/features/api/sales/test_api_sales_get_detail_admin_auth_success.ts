import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";

/**
 * Validate the GET /shoppingMall/adminUser/sales/{saleId} endpoint with
 * admin user authentication success scenario.
 *
 * This test performs the following steps:
 *
 * 1. Join a new admin user account with realistic credentials.
 * 2. Login with the admin user's credentials to establish authenticated
 *    context.
 * 3. Call the GET sales detail endpoint using the authenticated connection and
 *    a valid random UUID saleId.
 * 4. Validate the response matches the IShoppingMallSale structure, checking
 *    all required fields including nullable description and deleted_at.
 * 5. Attempt the GET sales detail endpoint without authentication, expecting
 *    an error.
 *
 * The test asserts correct typing and validates business logic via API.
 */
export async function test_api_sales_get_detail_admin_auth_success(
  connection: api.IConnection,
) {
  // 1. Create a new admin user with realistic data
  const adminCreateBody = {
    email: RandomGenerator.alphaNumeric(10) + "@example.com",
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(3),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  // 2. Login as the created admin user
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(loggedInAdmin);

  // 3. Use a random valid UUID as saleId to get sales detail
  const saleId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const salesDetail: IShoppingMallSale =
    await api.functional.shoppingMall.adminUser.sales.at(connection, {
      saleId,
    });
  typia.assert(salesDetail);

  // 4. Validate critical properties of the sales detail
  TestValidator.predicate(
    "salesDetail.id is UUID format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      salesDetail.id,
    ),
  );
  TestValidator.predicate(
    "salesDetail.shopping_mall_channel_id is UUID format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      salesDetail.shopping_mall_channel_id,
    ),
  );

  // shopping_mall_section_id can be null or UUID
  if (
    salesDetail.shopping_mall_section_id !== null &&
    salesDetail.shopping_mall_section_id !== undefined
  ) {
    TestValidator.predicate(
      "salesDetail.shopping_mall_section_id is UUID format",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        salesDetail.shopping_mall_section_id,
      ),
    );
  }

  TestValidator.predicate(
    "salesDetail.shopping_mall_seller_user_id is UUID format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      salesDetail.shopping_mall_seller_user_id,
    ),
  );

  TestValidator.predicate(
    "salesDetail.price is number",
    typeof salesDetail.price === "number",
  );
  TestValidator.predicate(
    "salesDetail.code is string",
    typeof salesDetail.code === "string",
  );
  TestValidator.predicate(
    "salesDetail.status is string",
    typeof salesDetail.status === "string",
  );
  TestValidator.predicate(
    "salesDetail.name is string",
    typeof salesDetail.name === "string",
  );

  // description can be string or null
  TestValidator.predicate(
    "salesDetail.description is string or null",
    salesDetail.description === null ||
      typeof salesDetail.description === "string",
  );

  // created_at and updated_at are date-time strings
  TestValidator.predicate(
    "salesDetail.created_at is ISO 8601 string",
    typeof salesDetail.created_at === "string" &&
      !isNaN(Date.parse(salesDetail.created_at)),
  );
  TestValidator.predicate(
    "salesDetail.updated_at is ISO 8601 string",
    typeof salesDetail.updated_at === "string" &&
      !isNaN(Date.parse(salesDetail.updated_at)),
  );

  // deleted_at can be null or ISO 8601 string or undefined
  if (salesDetail.deleted_at !== null && salesDetail.deleted_at !== undefined) {
    TestValidator.predicate(
      "salesDetail.deleted_at is ISO 8601 string",
      typeof salesDetail.deleted_at === "string" &&
        !isNaN(Date.parse(salesDetail.deleted_at)),
    );
  }

  // 5. Attempt to call sales detail without authentication - expect error
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthenticated access to sales detail should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.at(unauthConnection, {
        saleId,
      });
    },
  );
}
