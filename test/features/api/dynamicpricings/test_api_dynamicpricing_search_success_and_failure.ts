import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDynamicPricing";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";

/**
 * This end-to-end test function validates the dynamic pricing search
 * capability for shopping mall admin users.
 *
 * The test executes the following steps:
 *
 * 1. Create an admin user using the join endpoint.
 * 2. Login the admin user to obtain auth tokens.
 * 3. Perform various dynamic pricing search queries with the PATCH endpoint:
 *    a) An empty filter (no criteria) to check pagination and data
 *    presence. b) Filters using effective_from and effective_to dates to
 *    test date range filtering. c) Filter by status to test filtering by
 *    status. d) Filter by pricing_rule_id UUID to test specific rule
 *    filtering.
 * 4. Confirm that each response matches the expected DTO structures and
 *    business rules.
 * 5. Test unauthorized access by attempting to search without authentication.
 * 6. Test error conditions with invalid filter criteria, expecting errors.
 *
 * All API calls use proper request body types, and the test validates all
 * API responses using typia.assert. Each validation uses TestValidator to
 * assert business logic correctness.
 *
 * The test adheres strictly to schema property existence and formatting
 * rules.
 */

export async function test_api_dynamicpricing_search_success_and_failure(
  connection: api.IConnection,
) {
  // Step 1: Create an admin user
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // Step 2: Login the admin user
  const loginBody = {
    email: adminUser.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loggedInUser);

  // Step 3a: Search with empty filter
  const emptyFilterRequest = {} satisfies IShoppingMallDynamicPricing.IRequest;
  const pageEmptyFilter: IPageIShoppingMallDynamicPricing.ISummary =
    await api.functional.shoppingMall.adminUser.dynamicPricings.index(
      connection,
      {
        body: emptyFilterRequest,
      },
    );
  typia.assert(pageEmptyFilter);

  TestValidator.predicate(
    "pagination current page non-negative",
    pageEmptyFilter.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination limit non-negative",
    pageEmptyFilter.pagination.limit >= 0,
  );
  TestValidator.predicate(
    "pagination pages non-negative",
    pageEmptyFilter.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records non-negative",
    pageEmptyFilter.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pages consistent with records and limit",
    pageEmptyFilter.pagination.pages * pageEmptyFilter.pagination.limit >=
      pageEmptyFilter.pagination.records,
  );

  // Step 3b: Search by effective date range
  const dateFrom = new Date();
  dateFrom.setHours(dateFrom.getHours() - 24); // 24 hours ago
  const effectiveFromISO = dateFrom.toISOString();
  const dateTo = new Date();
  const effectiveToISO = dateTo.toISOString();

  const filterByDateRequest = {
    effective_from: effectiveFromISO,
    effective_to: effectiveToISO,
  } satisfies IShoppingMallDynamicPricing.IRequest;

  const pageFilteredByDate: IPageIShoppingMallDynamicPricing.ISummary =
    await api.functional.shoppingMall.adminUser.dynamicPricings.index(
      connection,
      {
        body: filterByDateRequest,
      },
    );
  typia.assert(pageFilteredByDate);

  for (const item of pageFilteredByDate.data) {
    TestValidator.predicate(
      "effective_from within filter range",
      item.effective_from >= effectiveFromISO &&
        item.effective_from <= effectiveToISO,
    );
  }

  // Step 3c: Search by status
  const statuses = ["active", "inactive"] as const;
  const statusValue = RandomGenerator.pick(statuses);
  const filterByStatusRequest = {
    status: statusValue,
  } satisfies IShoppingMallDynamicPricing.IRequest;

  const pageFilteredByStatus: IPageIShoppingMallDynamicPricing.ISummary =
    await api.functional.shoppingMall.adminUser.dynamicPricings.index(
      connection,
      {
        body: filterByStatusRequest,
      },
    );
  typia.assert(pageFilteredByStatus);

  for (const item of pageFilteredByStatus.data) {
    TestValidator.equals("status matches filter", item.status, statusValue);
  }

  // Step 3d: Search by pricing_rule_id
  if (pageEmptyFilter.data.length > 0) {
    const samplePricingRuleId = typia.random<string & tags.Format<"uuid">>();

    const filterByPricingRuleIdRequest = {
      pricing_rule_id: samplePricingRuleId,
    } satisfies IShoppingMallDynamicPricing.IRequest;

    const pageFilteredByRuleId: IPageIShoppingMallDynamicPricing.ISummary =
      await api.functional.shoppingMall.adminUser.dynamicPricings.index(
        connection,
        {
          body: filterByPricingRuleIdRequest,
        },
      );

    typia.assert(pageFilteredByRuleId);
  }

  // Step 4: Negative test cases

  // Unauthorized access test: create unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthorized access to dynamic pricings search",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.index(
        unauthConn,
        { body: {} },
      );
    },
  );

  // Invalid filter criteria
  const invalidFilterRequests = [
    { pricing_rule_id: "not-a-uuid" },
    { page: -1 },
    { limit: -10 },
  ] as const;

  for (const invalidRequest of invalidFilterRequests) {
    await TestValidator.error(
      "invalid filter criteria causes failure",
      async () => {
        await api.functional.shoppingMall.adminUser.dynamicPricings.index(
          connection,
          {
            body: invalidRequest as unknown as IShoppingMallDynamicPricing.IRequest,
          },
        );
      },
    );
  }
}
