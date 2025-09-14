import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";

/**
 * Test unauthorized failure when attempting to update a shopping mall sale
 * product as admin user.
 *
 * This test covers creating an admin user, logging in, then attempting to
 * update a sale product using an invalid UUID and without authorization.
 * The test verifies that unauthorized update attempts are properly
 * rejected.
 *
 * Steps:
 *
 * 1. Create admin user by join API with realistic credentials.
 * 2. Login as the admin user to establish authentication context.
 * 3. Try updating a sale with a random invalid saleId using an unauthenticated
 *    connection and expect failure.
 * 4. Try updating a sale with a random invalid saleId using the authenticated
 *    connection and expect failure.
 *
 * All requests are typed strictly with correct DTO usage and all API
 * responses are validated.
 */
export async function test_api_sales_update_admin_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = RandomGenerator.alphaNumeric(10);
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Login as admin user
  const loginUser = await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  typia.assert(loginUser);

  // 3. Attempt to update sale with invalid saleId (unauthorized path)
  // Use a separate unauthenticated connection to test missing auth
  const unauthConnection: api.IConnection = { ...connection, headers: {} };

  const invalidSaleId = typia.random<string & tags.Format<"uuid">>();
  const invalidUpdateBody = {
    name: RandomGenerator.name(),
    price: 12345,
    status: "active",
    code: RandomGenerator.alphaNumeric(8),
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallSale.IUpdate;

  // 4. Expect error when unauthenticated connection tries update
  await TestValidator.error("update sale fails without auth", async () => {
    await api.functional.shoppingMall.adminUser.sales.update(unauthConnection, {
      saleId: invalidSaleId,
      body: invalidUpdateBody,
    });
  });

  // 5. Expect error when authenticated admin tries to update a non-existent saleId
  await TestValidator.error(
    "update sale fails for invalid saleId",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.update(connection, {
        saleId: invalidSaleId,
        body: invalidUpdateBody,
      });
    },
  );
}
