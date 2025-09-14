import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";

/**
 * Test the API behavior when attempting to update a sale option group
 * without authentication or authorization.
 *
 * This test verifies that the API returns a permission denied error when a
 * request is made without valid admin credentials.
 *
 * Steps:
 *
 * 1. Create an unauthenticated connection by clearing headers.
 * 2. Generate a random UUID for the saleOptionGroupId path parameter.
 * 3. Create a valid update payload with optional code, name, and null
 *    deleted_at.
 * 4. Invoke the update endpoint with unauthenticated connection.
 * 5. Assert that HttpError is thrown indicating permission denial.
 */
export async function test_api_sale_option_group_update_permission_denied(
  connection: api.IConnection,
) {
  // 1. Create an unauthenticated (empty headers) connection to simulate no authorization.
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 2. Generate a random valid UUID for saleOptionGroupId path param
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  // 3. Generate a random update body for IShoppingMallSaleOptionGroup.IUpdate
  const body = {
    code: RandomGenerator.alphabets(8),
    name: RandomGenerator.name(),
    deleted_at: null,
  } satisfies IShoppingMallSaleOptionGroup.IUpdate;

  // 4. Attempt to update and expect HttpError due to lack of permission
  await TestValidator.error(
    "should throw permission denied HttpError",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.update(
        unauthConn,
        {
          saleOptionGroupId,
          body,
        },
      );
    },
  );
}
