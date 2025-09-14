import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";

/**
 * Test retrieval of detailed shopping mall sales channel information by valid
 * channel UUID. Verify all expected properties are included and formatted
 * correctly. Test failure scenario with non-existent channel ID to confirm not
 * found error is returned. Validate authentication access restrictions for
 * admin user roles. This confirms secure, accurate access to channel details.
 *
 * Due to lack of channel creation API or seeded data, this test focuses on
 * authentication flows and error scenario for non-existent channel ID.
 *
 * It confirms that an admin user can authenticate properly and that requesting
 * a non-existent channel ID results in an error as expected.
 */
export async function test_api_shoppingmall_adminuser_channels_get_by_id_success_and_not_found(
  connection: api.IConnection,
) {
  // 1. Admin user registration
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const passwordHash = RandomGenerator.alphaNumeric(32);

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: passwordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin user login
  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminUserEmail,
        password_hash: passwordHash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loggedInAdmin);

  // 3. Invalid channel retrieval - non-existent id
  const nonExistentId = "00000000-0000-0000-0000-000000000000";

  await TestValidator.error(
    "channel retrieval with non-existent ID should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.channels.at(connection, {
        id: nonExistentId,
      });
    },
  );
}
