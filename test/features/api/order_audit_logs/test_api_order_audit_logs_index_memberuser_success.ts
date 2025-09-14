import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallOrderAuditLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderAuditLog";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrderAuditLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderAuditLog";

/**
 * Validate member user authentication and retrieving paged order audit logs
 * with various filtering options.
 *
 * Test steps:
 *
 * 1. Register a new member user account to get authorization token.
 * 2. Login with the same member user credentials.
 * 3. Perform multiple requests to the PATCH
 *    /shoppingMall/memberUser/orderAuditLogs endpoint with different filter
 *    combinations in request body.
 * 4. Validate the responses conform to the expected paged results structure and
 *    filters work correctly.
 */
export async function test_api_order_audit_logs_index_memberuser_success(
  connection: api.IConnection,
) {
  // 1. Member user join
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(8),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: joinBody });
  typia.assert(authorizedUser);

  // 2. Member user login
  const loginBody = {
    email: authorizedUser.email satisfies string as string,
    password: joinBody.password_hash satisfies string as string,
  } satisfies IShoppingMallMemberUser.ILogin;
  const loggedInUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, { body: loginBody });
  typia.assert(loggedInUser);

  // Helper to generate valid UUID
  const randomUuid = (): string & tags.Format<"uuid"> =>
    typia.random<string & tags.Format<"uuid">>();

  // 3. Query order audit logs with no filter (empty request)
  const emptyRequestBody = {} satisfies IShoppingMallOrderAuditLog.IRequest;
  const emptyResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: emptyRequestBody },
    );
  typia.assert(emptyResponse);
  TestValidator.predicate(
    "empty filter returns data and pagination",
    Array.isArray(emptyResponse.data) && !!emptyResponse.pagination,
  );

  // 4. Query with shopping_mall_order_id filter
  const orderIdFilter = randomUuid();
  const orderIdRequest = {
    shopping_mall_order_id: orderIdFilter,
  } satisfies IShoppingMallOrderAuditLog.IRequest;
  const orderIdResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: orderIdRequest },
    );
  typia.assert(orderIdResponse);
  TestValidator.predicate(
    "shopping_mall_order_id filter returns data",
    Array.isArray(orderIdResponse.data),
  );
  // All returned entries must have the requested order_id
  for (const entry of orderIdResponse.data) {
    TestValidator.equals(
      "order id matches filter",
      entry.shopping_mall_order_id,
      orderIdFilter,
    );
  }

  // 5. Query with actor_user_id filter
  const actorUserIdFilter = randomUuid();
  const actorUserIdRequest = {
    actor_user_id: actorUserIdFilter,
  } satisfies IShoppingMallOrderAuditLog.IRequest;
  const actorUserIdResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: actorUserIdRequest },
    );
  typia.assert(actorUserIdResponse);
  TestValidator.predicate(
    "actor_user_id filter returns data",
    Array.isArray(actorUserIdResponse.data),
  );
  for (const entry of actorUserIdResponse.data) {
    // actor_user_id is optional so validate only when present
    if (entry.actor_user_id !== null && entry.actor_user_id !== undefined) {
      TestValidator.equals(
        "actor user id matches filter",
        entry.actor_user_id,
        actorUserIdFilter,
      );
    }
  }

  // 6. Query with action filter
  const actionFilter = "order created";
  const actionRequest = {
    action: actionFilter,
  } satisfies IShoppingMallOrderAuditLog.IRequest;
  const actionResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: actionRequest },
    );
  typia.assert(actionResponse);
  TestValidator.predicate(
    "action filter returns data",
    Array.isArray(actionResponse.data),
  );
  for (const entry of actionResponse.data) {
    TestValidator.predicate(
      "action includes filter text",
      entry.action.includes(actionFilter),
    );
  }

  // 7. Query with performed_at_from and performed_at_to date filter
  const fromDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days ago
  const toDate = new Date().toISOString();
  const dateRangeRequest = {
    performed_at_from: fromDate satisfies string as string &
      tags.Format<"date-time">,
    performed_at_to: toDate satisfies string as string &
      tags.Format<"date-time">,
  } satisfies IShoppingMallOrderAuditLog.IRequest;
  const dateRangeResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: dateRangeRequest },
    );
  typia.assert(dateRangeResponse);
  TestValidator.predicate(
    "date range filter returns data",
    Array.isArray(dateRangeResponse.data),
  );
  for (const entry of dateRangeResponse.data) {
    TestValidator.predicate(
      "performed_at within range",
      entry.performed_at >= fromDate && entry.performed_at <= toDate,
    );
  }

  // 8. Query with combined filters
  const combinedRequest = {
    shopping_mall_order_id: orderIdFilter,
    actor_user_id: actorUserIdFilter,
    action: actionFilter,
    performed_at_from: fromDate satisfies string as string &
      tags.Format<"date-time">,
    performed_at_to: toDate satisfies string as string &
      tags.Format<"date-time">,
  } satisfies IShoppingMallOrderAuditLog.IRequest;
  const combinedResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: combinedRequest },
    );
  typia.assert(combinedResponse);
  TestValidator.predicate(
    "combined filters returns data",
    Array.isArray(combinedResponse.data),
  );

  // 9. Query with pagination parameters page and limit
  const paginationRequest = {
    page: 1,
    limit: 10,
  } satisfies IShoppingMallOrderAuditLog.IRequest;
  const paginationResponse: IPageIShoppingMallOrderAuditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.indexOrderAuditLogs(
      connection,
      { body: paginationRequest },
    );
  typia.assert(paginationResponse);
  TestValidator.predicate(
    "pagination data count <= limit",
    paginationResponse.data.length <= (paginationRequest.limit ?? 0),
  );
  TestValidator.predicate(
    "pagination page is correct",
    paginationResponse.pagination.current === (paginationRequest.page ?? 1),
  );
  TestValidator.predicate(
    "pagination limit is correct",
    paginationResponse.pagination.limit === (paginationRequest.limit ?? 0),
  );
  TestValidator.predicate(
    "pagination pages count is positive",
    paginationResponse.pagination.pages > 0,
  );
  TestValidator.predicate(
    "pagination records count is positive",
    paginationResponse.pagination.records >= 0,
  );
}
