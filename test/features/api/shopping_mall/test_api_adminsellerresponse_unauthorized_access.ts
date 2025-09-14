import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerResponse";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";

/**
 * Test that an unauthenticated request to the admin seller responses listing
 * endpoint is rejected.
 *
 * This test confirms the enforcement of authentication and authorization rules
 * by the seller responses API. It executes the prerequisite admin user join to
 * establish admin user context, then uses a deliberately unauthenticated
 * connection to call the seller responses index, expecting an authorization
 * failure.
 *
 * Steps:
 *
 * 1. Perform admin user join to establish prerequisite user.
 * 2. Attempt to retrieve seller responses without authentication.
 * 3. Validate that the call fails due to unauthorized access.
 */
export async function test_api_adminsellerresponse_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Admin user join to setup prerequisite
  const adminCreateBody: IShoppingMallAdminUser.ICreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  };

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create unauthenticated connection - empty headers to simulate unauthorized access
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Attempt to call sellerResponses.index endpoint without auth. This must fail with HttpError (401 or similar)
  await TestValidator.error(
    "unauthorized access to seller responses should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sellerResponses.index(
        unauthenticatedConnection,
        {
          body: {} satisfies IShoppingMallSellerResponse.IRequest,
        },
      );
    },
  );
}
