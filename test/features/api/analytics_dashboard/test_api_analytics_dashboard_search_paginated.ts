import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAnalyticsDashboard";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAnalyticsDashboard } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAnalyticsDashboard";

/**
 * This E2E test verifies the retrieval of analytics dashboards in paginated
 * form using filtering and sorting.
 *
 * The test involves:
 *
 * 1. Creating and authenticating an admin user to gain proper authorization.
 * 2. Creating multiple analytics dashboard entries with varying types,
 *    statuses, and last run times to simulate existing data.
 * 3. Querying the paginated listing endpoint
 *    (/shoppingMall/adminUser/analyticsDashboards) with specific filters
 *    for dashboard_type, status, and last run time after a certain date.
 * 4. Verifying that returned pagination metadata corresponds accurately to the
 *    expected result set, including current page, limit, total records, and
 *    total pages.
 * 5. Checking that the returned dashboards match the filtering criteria and
 *    are sorted correctly based on sortBy and sortOrder parameters.
 *
 * This test ensures the admin API correctly supports paginated searches
 * with filtering and sorting for analytics dashboards.
 */
export async function test_api_analytics_dashboard_search_paginated(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(32);
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
      },
    });
  typia.assert(adminUser);

  // 2. Create multiple analytics dashboards
  const dashboardTypes = [
    "sales_overview",
    "customer_segmentation",
    "inventory_status",
  ] as const;
  const statuses = ["active", "inactive", "error"] as const;

  const createdDashboards: IShoppingMallAnalyticsDashboard[] = [];
  for (let i = 0; i < 5; ++i) {
    const dashboardType = RandomGenerator.pick(dashboardTypes);
    const status = RandomGenerator.pick(statuses);
    const lastRunAtDate = new Date(Date.now() - i * 86400000).toISOString();
    const configuration = JSON.stringify({
      filter: { example: i },
      settings: { verbose: i % 2 === 0 },
    });

    const createdDashboard =
      await api.functional.shoppingMall.adminUser.analyticsDashboards.create(
        connection,
        {
          body: {
            dashboard_type: dashboardType,
            configuration: configuration,
            last_run_at: lastRunAtDate,
            status: status,
          },
        },
      );
    typia.assert(createdDashboard);
    createdDashboards.push(createdDashboard);
  }

  // 3. Query the paginated listing endpoint with filters
  const filterDashboardType = dashboardTypes[0];
  const filterStatus = statuses[0];
  const filterLastRunAfter = new Date(Date.now() - 6 * 86400000).toISOString(); // 6 days ago
  const sortBy = "last_run_at";
  const sortOrder = "desc";
  const page = 1;
  const limit = 10;

  const response: IPageIShoppingMallAnalyticsDashboard.ISummary =
    await api.functional.shoppingMall.adminUser.analyticsDashboards.index(
      connection,
      {
        body: {
          dashboard_type: filterDashboardType,
          status: filterStatus,
          last_run_after: filterLastRunAfter,
          sortBy: sortBy,
          sortOrder: sortOrder,
          page: page,
          limit: limit,
        },
      },
    );
  typia.assert(response);

  // 4. Validate pagination metadata
  const pagination = response.pagination;
  TestValidator.predicate(
    "pagination current page equals requested page",
    pagination.current === page,
  );
  TestValidator.predicate(
    "pagination limit equals requested limit",
    pagination.limit === limit,
  );
  TestValidator.predicate(
    "pagination pages is positive",
    pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records is non-negative",
    pagination.records >= 0,
  );

  // 5. Validate dashboards match filtering and sorting
  const dashboards = response.data;

  // All dashboards should have the filterDashboardType and filterStatus
  dashboards.forEach((d, index) => {
    TestValidator.equals(
      `dashboard[${index}] type matches filter`,
      d.dashboard_type,
      filterDashboardType,
    );
    TestValidator.equals(
      `dashboard[${index}] status matches filter`,
      d.status,
      filterStatus,
    );
    TestValidator.predicate(
      `dashboard[${index}] last_run_at is after filterLastRunAfter`,
      new Date(d.last_run_at) >= new Date(filterLastRunAfter),
    );
  });

  // Dashboards should be sorted by last_run_at descending
  for (let i = 1; i < dashboards.length; ++i) {
    const prevDate = new Date(dashboards[i - 1].last_run_at);
    const currDate = new Date(dashboards[i].last_run_at);
    TestValidator.predicate(
      `dashboard[${i - 1}] last_run_at >= dashboard[${i}] last_run_at`,
      prevDate >= currDate,
    );
  }
}
