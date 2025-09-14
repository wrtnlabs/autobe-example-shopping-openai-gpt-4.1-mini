import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * This test verifies the update API for analytics dashboards.
 *
 * It first creates an admin user to acquire authorization, then tries to update
 * an analytics dashboard using a valid but non-existent analyticsDashboardId to
 * test handling of not found.
 *
 * It then tries invalid update requests with improper field values to check
 * validation errors.
 *
 * Appropriate errors are expected for invalid ID and invalid update payload.
 */
export async function test_api_adminuser_analytics_dashboard_update_not_found_or_validation_error(
  connection: api.IConnection,
) {
  // 1. Create admin user to authenticate and establish admin context
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "securePassword123";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Try updating analytics dashboard with a valid but non-existent UUID to test not found error
  const nonExistentDashboardId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // Invalid ID with no corresponding resource
  await TestValidator.error(
    "updating with non-existent analyticsDashboardId results in error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.update(
        connection,
        {
          analyticsDashboardId: nonExistentDashboardId,
          body: {
            dashboard_type: "invalid-type", // Intentionally invalid but allowed string (testing validation)
            configuration: "{}",
            last_run_at: new Date().toISOString(),
            status: "active",
          } satisfies IShoppingMallAnalyticsDashboard.IUpdate,
        },
      );
    },
  );

  // 3. Try invalid update payloads to test validation logic
  const validDashboardId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // Send invalid last_run_at value (malformed date)
  await TestValidator.error(
    "updating dashboard with invalid last_run_at format results in error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.update(
        connection,
        {
          analyticsDashboardId: validDashboardId,
          body: {
            last_run_at: "not-a-date",
          } satisfies IShoppingMallAnalyticsDashboard.IUpdate,
        },
      );
    },
  );

  // Send invalid status value
  await TestValidator.error(
    "updating dashboard with invalid status string results in error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.update(
        connection,
        {
          analyticsDashboardId: validDashboardId,
          body: {
            status: "invalid-status",
          } satisfies IShoppingMallAnalyticsDashboard.IUpdate,
        },
      );
    },
  );

  // Send empty configuration string which might be invalid depending on backend
  await TestValidator.error(
    "updating dashboard with empty configuration string results in error",
    async () => {
      await api.functional.shoppingMall.adminUser.analyticsDashboards.update(
        connection,
        {
          analyticsDashboardId: validDashboardId,
          body: {
            configuration: "",
          } satisfies IShoppingMallAnalyticsDashboard.IUpdate,
        },
      );
    },
  );
}
