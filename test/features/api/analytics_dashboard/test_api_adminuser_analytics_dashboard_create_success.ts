import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * Validates the full E2E flow of creating a new analytics dashboard by an
 * authenticated admin user.
 *
 * The test performs the following steps:
 *
 * 1. Creates and authenticates a new admin user using the /auth/adminUser/join
 *    endpoint.
 * 2. Prepares a realistic and valid dashboard creation request with dashboard
 *    type, configuration JSON, last run timestamp, and status.
 * 3. Calls the /shoppingMall/adminUser/analyticsDashboards POST endpoint to
 *    create the analytics dashboard.
 * 4. Asserts the returned result includes all expected properties, validates
 *    the UUID format of the dashboard id, and checks timestamps.
 *
 * This test ensures the analytics dashboard creation API works correctly
 * for authorized admin users with valid input data.
 */
export async function test_api_adminuser_analytics_dashboard_create_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare analytics dashboard creation data
  const dashboardCreateBody = {
    dashboard_type: "sales_overview",
    configuration: JSON.stringify({
      filters: { region: "all", metrics: ["revenue", "profit"] },
      layout: "grid",
    }),
    last_run_at: new Date().toISOString(),
    status: "active",
  } satisfies IShoppingMallAnalyticsDashboard.ICreate;

  // 3. Create analytics dashboard
  const createdDashboard: IShoppingMallAnalyticsDashboard =
    await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
      connection,
      {
        body: dashboardCreateBody,
      },
    );
  typia.assert(createdDashboard);

  // 4. Validate returned dashboard data
  TestValidator.equals(
    "dashboard_type matches input",
    createdDashboard.dashboard_type,
    dashboardCreateBody.dashboard_type,
  );
  TestValidator.equals(
    "configuration matches input",
    createdDashboard.configuration,
    dashboardCreateBody.configuration,
  );
  TestValidator.equals(
    "last_run_at matches input",
    createdDashboard.last_run_at,
    dashboardCreateBody.last_run_at,
  );
  TestValidator.equals(
    "status matches input",
    createdDashboard.status,
    dashboardCreateBody.status,
  );

  // Validate generated id and timestamps
  typia.assert<string & tags.Format<"uuid">>(createdDashboard.id);
  TestValidator.predicate(
    "created_at is valid ISO date",
    !isNaN(Date.parse(createdDashboard.created_at)),
  );
  TestValidator.predicate(
    "updated_at is valid ISO date",
    !isNaN(Date.parse(createdDashboard.updated_at)),
  );
}
