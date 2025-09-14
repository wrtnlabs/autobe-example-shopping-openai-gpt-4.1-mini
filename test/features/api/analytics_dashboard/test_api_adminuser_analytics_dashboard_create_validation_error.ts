import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * Tests validation error handling during analytics dashboard creation by an
 * admin user.
 *
 * This test first creates a valid admin user account using the join
 * endpoint, automatically managing authentication tokens. Then, it attempts
 * to create analytics dashboards with various invalid input bodies, each
 * missing or having invalid required fields. The test verifies that each
 * invalid input triggers a validation error from the server.
 *
 * Scenarios covered include empty dashboard_type, empty or malformed
 * configuration JSON strings, missing or invalid ISO 8601 last_run_at
 * timestamps, and empty or missing status strings. This ensures robust
 * validation logic on the server side prevents invalid data from being
 * created.
 *
 * All required properties are included when not explicitly omitted for
 * validation testing. All API calls are awaited, and responses are
 * type-asserted using typia.
 *
 * Each validation error is asserted using await TestValidator.error with
 * descriptive titles for traceability.
 */
export async function test_api_adminuser_analytics_dashboard_create_validation_error(
  connection: api.IConnection,
) {
  // 1. Create valid admin user and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(32); // pretend hashed password
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name();
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Attempt to create analytics dashboard with empty dashboard_type
  await TestValidator.error(
    "empty dashboard_type should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: "",
            configuration: "{}",
            last_run_at: new Date().toISOString(),
            status: "active",
          } satisfies IShoppingMallAnalyticsDashboard.ICreate,
        },
      );
    },
  );

  // 3. Attempt with empty configuration string
  await TestValidator.error(
    "empty configuration string should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: "sales_overview",
            configuration: "",
            last_run_at: new Date().toISOString(),
            status: "active",
          } satisfies IShoppingMallAnalyticsDashboard.ICreate,
        },
      );
    },
  );

  // 4. Attempt with malformed JSON configuration
  await TestValidator.error(
    "malformed configuration JSON string should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: "customer_segments",
            configuration: "{ this is not: valid json }",
            last_run_at: new Date().toISOString(),
            status: "active",
          } satisfies IShoppingMallAnalyticsDashboard.ICreate,
        },
      );
    },
  );

  // 5. Attempt with missing last_run_at
  await TestValidator.error(
    "missing last_run_at should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          // Since last_run_at is required, omit property
          body: {
            dashboard_type: "performance_metrics",
            configuration: "{}",
            // last_run_at omitted
            status: "active",
          } as unknown as IShoppingMallAnalyticsDashboard.ICreate, // omit only to simulate
        },
      );
    },
  );

  // 6. Attempt with invalid last_run_at date format
  await TestValidator.error(
    "invalid last_run_at date format should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: "error_rates",
            configuration: "{}",
            last_run_at: "not-a-valid-date",
            status: "active",
          } satisfies IShoppingMallAnalyticsDashboard.ICreate,
        },
      );
    },
  );

  // 7. Attempt with empty status string
  await TestValidator.error(
    "empty status string should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: "uptime_monitor",
            configuration: "{}",
            last_run_at: new Date().toISOString(),
            status: "",
          } satisfies IShoppingMallAnalyticsDashboard.ICreate,
        },
      );
    },
  );

  // 8. Attempt with missing status
  await TestValidator.error(
    "missing status should raise validation error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: "revenue_analysis",
            configuration: "{}",
            last_run_at: new Date().toISOString(),
            // status omitted
          } as unknown as IShoppingMallAnalyticsDashboard.ICreate, // omit only to simulate
        },
      );
    },
  );
}
