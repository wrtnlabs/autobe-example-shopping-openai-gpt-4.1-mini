import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallChannelCategory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * Test unauthorized access to the channel-category mappings search
 * operation.
 *
 * This test verifies that attempting to access the PATCH
 * /shoppingMall/adminUser/channelCategories endpoint without admin user
 * authentication correctly results in an error, enforcing access control
 * policies. It pre-creates an admin user to satisfy dependency requirements
 * but deliberately uses an unauthenticated connection to trigger the
 * unauthorized error condition.
 */
export async function test_api_channel_category_index_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Create an admin user by calling the authentication join endpoint, the prerequisite to have admin user accounts on system.
  const adminUserCreateBody = {
    email: "admin_user@example.com",
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  await api.functional.auth.adminUser.join(connection, {
    body: adminUserCreateBody,
  });

  // 2. Attempt to access the admin channel category index endpoint without authenticating as admin user
  // By creating a new connection instance with empty headers to simulate unauthenticated user
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // Prepare a valid body parameter (filter parameters can be empty or minimal since unauthorized is expected)
  const requestBody = {} satisfies IShoppingMallChannelCategory.IRequest;

  // 3. Test that the request is rejected due to unauthorized access
  await TestValidator.error(
    "unauthorized access to channel category index should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        unauthConn,
        { body: requestBody },
      );
    },
  );
}
