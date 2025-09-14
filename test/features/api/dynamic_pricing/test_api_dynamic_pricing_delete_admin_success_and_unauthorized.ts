import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Validate deletion of dynamic pricing records by an admin user.
 *
 * 1. Create an admin user account by joining.
 * 2. Delete an existing dynamic pricing record by UUID.
 * 3. Confirm no content response.
 * 4. Test deletion with no authentication - expect authorization error.
 * 5. Test deletion with unauthorized role - expect authorization error.
 * 6. Test deletion of non-existent dynamic pricing record - expect not found
 *    error.
 */
export async function test_api_dynamic_pricing_delete_admin_success_and_unauthorized(
  connection: api.IConnection,
) {
  // 1. Admin user join and authenticate
  const adminJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminJoinBody,
    });
  typia.assert(adminAuthorized);

  // 2. Delete an existing dynamic pricing record
  // Generate a UUID for dynamicPricingId
  const existingDynamicPricingId = typia.random<string & tags.Format<"uuid">>();

  // Perform deletion - expect void return
  await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
    connection,
    { dynamicPricingId: existingDynamicPricingId },
  );

  // 3. Unauthorized deletion attempt with no authentication (empty headers)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized deletion with no authentication",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
        unauthenticatedConnection,
        { dynamicPricingId: existingDynamicPricingId },
      );
    },
  );

  // 4. Unauthorized deletion attempt with unauthorized role
  // Use fresh connection without admin authentication
  const unauthorizedConnection: api.IConnection = {
    host: connection.host,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized deletion with unauthorized role",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
        unauthorizedConnection,
        { dynamicPricingId: existingDynamicPricingId },
      );
    },
  );

  // 5. Deletion of non-existent dynamic pricing ID
  const nonExistentDynamicPricingId = typia.random<
    string & tags.Format<"uuid">
  >();

  await TestValidator.error(
    "deletion of non-existent dynamic pricing id",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.erase(
        connection,
        { dynamicPricingId: nonExistentDynamicPricingId },
      );
    },
  );
}
