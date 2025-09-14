import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * Test the successful retrieval of analytics dashboard details after
 * authenticating as an admin user.
 *
 * Steps:
 *
 * 1. Create a new admin user via /auth/adminUser/join with valid credentials and
 *    user info.
 * 2. Verify that an authentication token is issued.
 * 3. Use the admin user authentication context (token) to request analytics
 *    dashboard details by a valid UUID.
 * 4. Assert that the response matches the expected IShoppingMallAnalyticsDashboard
 *    structure.
 * 5. Call the API with a well-formed but non-existent UUID and verify an error is
 *    thrown.
 */
export async function test_api_analytics_dashboard_detail_retrieval_with_authentication_context(
  connection: api.IConnection,
) {
  // Step 1: Create a new admin user
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32), // simulate hashed password
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // Step 2: Ensure authentication token is issued and non-empty
  TestValidator.predicate(
    "admin user authentication token access is non-empty",
    typeof adminUser.token.access === "string" &&
      adminUser.token.access.length > 0,
  );

  // Step 3: Retrieve analytics dashboard details by valid ID
  // Use a valid UUID from typia.random, assuming this dashboard exists or will be handled by simulation in test environments
  const validDashboardId = typia.random<string & tags.Format<"uuid">>();
  const dashboard: IShoppingMallAnalyticsDashboard =
    await api.functional.shoppingMall.adminUser.analyticsDashboards.at(
      connection,
      {
        analyticsDashboardId: validDashboardId,
      },
    );

  typia.assert(dashboard);

  // Step 4: Validate required properties in the response
  TestValidator.predicate(
    "dashboard id matches requested id",
    dashboard.id === validDashboardId,
  );

  TestValidator.predicate(
    "dashboard_type is a non-empty string",
    typeof dashboard.dashboard_type === "string" &&
      dashboard.dashboard_type.length > 0,
  );

  TestValidator.predicate(
    "configuration is a JSON string",
    typeof dashboard.configuration === "string",
  );

  TestValidator.predicate(
    "last_run_at is ISO 8601 date-time string",
    /^[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[ T]([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.\d+)?(Z|[+-]([01][0-9]|2[0-3]):[0-5][0-9])?$/.test(
      dashboard.last_run_at,
    ),
  );

  TestValidator.predicate(
    "status is a non-empty string",
    typeof dashboard.status === "string" && dashboard.status.length > 0,
  );

  // Step 5: Attempt retrieval with a valid but non-existent UUID, expect error
  const nonExistentUuid = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "retrieval with non-existent UUID should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.at(
        connection,
        {
          analyticsDashboardId: nonExistentUuid,
        },
      );
    },
  );
}
