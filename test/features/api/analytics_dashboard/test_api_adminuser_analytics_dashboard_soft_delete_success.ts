import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * This test function validates soft deletion of an analytics dashboard by
 * an authorized admin user.
 *
 * It first creates an admin user with valid details to establish
 * authentication context. Next, it creates an analytics dashboard record
 * with typical configuration and metadata. Then, it performs a soft delete
 * operation on the created dashboard via its delete API endpoint. Finally,
 * it verifies the deletion by ensuring the operation completes without
 * error. Since no GET for a deleted dashboard is provided, the deletion
 * timestamp's presence is trusted from creation and delete success.
 *
 * Steps:
 *
 * 1. Create admin user and authenticate
 * 2. Create analytics dashboard
 * 3. Soft delete the analytics dashboard
 * 4. (Implied) Verify deletion success by lack of error and through existing
 *    API guarantees
 */
export async function test_api_adminuser_analytics_dashboard_soft_delete_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Create analytics dashboard
  const dashboardBody = {
    dashboard_type: "sales_overview",
    configuration: JSON.stringify({ filter: "none", refreshInterval: 60 }),
    last_run_at: new Date().toISOString(),
    status: "active",
  } satisfies IShoppingMallAnalyticsDashboard.ICreate;

  const createdDashboard: IShoppingMallAnalyticsDashboard =
    await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
      connection,
      {
        body: dashboardBody,
      },
    );
  typia.assert(createdDashboard);

  // 3. Soft delete the analytics dashboard
  await api.functional.shoppingMall.adminUser.analyticsDashboards.erase(
    connection,
    {
      analyticsDashboardId: createdDashboard.id,
    },
  );

  // 4. No direct GET for deleted dashboard; assume success if no error thrown
}
