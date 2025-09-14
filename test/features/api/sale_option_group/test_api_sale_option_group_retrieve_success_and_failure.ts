import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Test the sale option group retrieval from the admin user perspective in a
 * shopping mall management system.
 *
 * Validates successful authorized retrieval of a sale option group using a
 * valid UUID. Tests also invalid UUID format rejection and unauthorized access
 * denial scenarios.
 *
 * 1. Create an admin user to obtain authorized access.
 * 2. Use the generated (random) UUID to attempt a sale option group retrieval. In
 *    real environment, this UUID might not exist but demonstrates API
 *    validation.
 * 3. Confirm correct data shape and presence of core fields.
 * 4. Test error on invalid UUID format.
 * 5. Test error on unauthorized access (empty headers).
 */
export async function test_api_sale_option_group_retrieve_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Admin user creation by join API
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "validpasswordhash123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      },
    });
  typia.assert(adminUser);

  // 2. Prepare a valid UUID for sale option group retrieval testing
  // Note: Since creation API is not available, using a random UUID
  // assumes an existing entry or backend handling for testing purposes
  const validSaleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  // 3. Test successful retrieval (assuming validSaleOptionGroupId exists)
  const saleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.adminUser.saleOptionGroups.at(
      connection,
      {
        saleOptionGroupId: validSaleOptionGroupId,
      },
    );
  typia.assert(saleOptionGroup);

  TestValidator.equals(
    "retrieved saleOptionGroup id equals",
    saleOptionGroup.id,
    validSaleOptionGroupId,
  );
  TestValidator.predicate(
    "retrieved saleOptionGroup has code",
    typeof saleOptionGroup.code === "string" && saleOptionGroup.code.length > 0,
  );
  TestValidator.predicate(
    "retrieved saleOptionGroup has valid created_at",
    typeof saleOptionGroup.created_at === "string" &&
      !isNaN(Date.parse(saleOptionGroup.created_at)),
  );

  // 4. Test invalid format for saleOptionGroupId (not a UUID), expect error
  await TestValidator.error("invalid ID format throws error", async () => {
    await api.functional.shoppingMall.adminUser.saleOptionGroups.at(
      connection,
      {
        saleOptionGroupId: "invalid-uuid-format",
      },
    );
  });

  // 5. Test unauthorized access (no auth headers), expect error
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized access throws error", async () => {
    await api.functional.shoppingMall.adminUser.saleOptionGroups.at(
      unauthenticatedConnection,
      { saleOptionGroupId: validSaleOptionGroupId },
    );
  });
}
