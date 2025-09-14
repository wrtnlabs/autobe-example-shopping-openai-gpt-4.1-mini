import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

export async function test_api_adminuser_analytics_dashboard_soft_delete_not_found(
  connection: api.IConnection,
) {
  // 1. Join as admin user to establish authorization context
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: RandomGenerator.alphaNumeric(8) + "@example.com",
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Attempt soft delete on non-existent analyticsDashboardId
  const fakeId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "soft delete on non-existent analytics dashboard should throw HttpError",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.erase(
        connection,
        {
          analyticsDashboardId: fakeId,
        },
      );
    },
  );
}
