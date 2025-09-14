import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";

/**
 * Validates that the system correctly handles attempts to retrieve details
 * of a sale product by an admin user when the saleId is invalid or does not
 * exist.
 *
 * Business Context: Admin users have the authorization to retrieve sale
 * product details. This test ensures that when an admin user attempts to
 * retrieve details with invalid identifiers, the system responds with
 * appropriate errors.
 *
 * Test Workflow:
 *
 * 1. Create a new admin user (required fields: email, password_hash, nickname,
 *    full_name, status).
 * 2. Login as the newly created admin user to obtain an authorization token.
 * 3. Attempt to retrieve sale details with an invalid UUID format as saleId
 *    and confirm error.
 * 4. Attempt to retrieve sale details with a valid UUID format but
 *    non-existent saleId and confirm error.
 */
export async function test_api_sales_get_detail_admin_invalid_id_not_found(
  connection: api.IConnection,
) {
  // 1. Admin user creation
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = RandomGenerator.alphaNumeric(64); // strong hashed password format
  const adminNickname = RandomGenerator.name(2);
  const adminFullName = RandomGenerator.name(3);

  const adminCreate = {
    email: adminEmail,
    password_hash: adminPasswordHash,
    nickname: adminNickname,
    full_name: adminFullName,
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: adminCreate,
  });
  typia.assert(adminUser);

  // 2. Admin user login
  const adminLogin = {
    email: adminEmail,
    password_hash: adminPasswordHash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminAuthorized = await api.functional.auth.adminUser.login(
    connection,
    { body: adminLogin },
  );
  typia.assert(adminAuthorized);

  // 3. Attempt to retrieve sale detail with invalid UUID format
  const invalidSaleId = "not-a-valid-uuid-format";
  await TestValidator.error(
    "invalid saleId format should throw error",
    async () => {
      // We need to forcibly cast here since the saleId parameter is UUID formatted string only
      await api.functional.shoppingMall.adminUser.sales.at(connection, {
        saleId: invalidSaleId as string & tags.Format<"uuid">,
      });
    },
  );

  // 4. Attempt to retrieve sale detail with valid UUID format but non-existent id
  const nonExistentSaleId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "non-existent saleId should throw error",
    async () => {
      await api.functional.shoppingMall.adminUser.sales.at(connection, {
        saleId: nonExistentSaleId,
      });
    },
  );
}
