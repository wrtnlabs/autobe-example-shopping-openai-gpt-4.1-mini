import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * Test updating an existing analytics dashboard's configuration, status, and
 * last run timestamp by an authorized admin. Ensure the update reflects
 * correctly in the returned updated dashboard record.
 *
 * Test flow:
 *
 * 1. Create an admin user with valid email, hashed password, nickname, full_name,
 *    and status.
 * 2. Authenticate and authorize admin user.
 * 3. Create an analytics dashboard with required fields.
 * 4. Update the analytics dashboard with new dashboard_type, configuration,
 *    status, and last_run_at.
 * 5. Validate the updated dashboard matches the new data, except for immutable
 *    fields such as creation timestamps and id.
 */
export async function test_api_adminuser_analytics_dashboard_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const email = typia.random<string & tags.Format<"email">>();
  const createAdminBody = {
    email: email,
    password_hash: "hashed_password_123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: createAdminBody,
    });
  typia.assert(adminUser);

  // 2. Create an initial analytics dashboard to be updated
  const initialDashboardCreateBody = {
    dashboard_type: "sales_overview",
    configuration: JSON.stringify({ filter: "initial" }),
    last_run_at: new Date().toISOString(),
    status: "active",
  } satisfies IShoppingMallAnalyticsDashboard.ICreate;
  const createdDashboard: IShoppingMallAnalyticsDashboard =
    await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
      connection,
      {
        body: initialDashboardCreateBody,
      },
    );
  typia.assert(createdDashboard);

  // 3. Prepare update data
  const updateBody = {
    dashboard_type: "sales_detail",
    configuration: JSON.stringify({ filter: "updated", range: "last_month" }),
    last_run_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    status: "inactive",
  } satisfies IShoppingMallAnalyticsDashboard.IUpdate;

  // 4. Perform the update
  const updatedDashboard: IShoppingMallAnalyticsDashboard =
    await api.functional.shoppingMall.adminUser.analyticsDashboards.update(
      connection,
      {
        analyticsDashboardId: createdDashboard.id,
        body: updateBody,
      },
    );
  typia.assert(updatedDashboard);

  // 5. Validate updated fields
  TestValidator.equals(
    "id should remain unchanged",
    updatedDashboard.id,
    createdDashboard.id,
  );
  TestValidator.equals(
    "dashboard_type should be updated",
    updatedDashboard.dashboard_type,
    updateBody.dashboard_type,
  );
  TestValidator.equals(
    "configuration should be updated",
    updatedDashboard.configuration,
    updateBody.configuration,
  );
  TestValidator.equals(
    "status should be updated",
    updatedDashboard.status,
    updateBody.status,
  );
  TestValidator.equals(
    "last_run_at should be updated",
    updatedDashboard.last_run_at,
    updateBody.last_run_at,
  );

  // 6. Validate timestamps of returned dashboard
  typia.assert(updatedDashboard.created_at);
  typia.assert(updatedDashboard.updated_at);
}
