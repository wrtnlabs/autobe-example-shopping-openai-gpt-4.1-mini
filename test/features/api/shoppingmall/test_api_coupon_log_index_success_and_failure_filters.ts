import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCouponLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCouponLog";
import type { IShoppingMallCouponLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponLog";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_coupon_log_index_success_and_failure_filters(
  connection: api.IConnection,
) {
  // 1. Member user join - create a new user and get the authorization token
  const joinBody = {
    email: `user${Date.now()}@example.com`,
    password_hash: "SecurePassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser = await api.functional.auth.memberUser.join(connection, {
    body: joinBody,
  });
  typia.assert(authorizedUser);

  // 2. Member user login with joined credentials to switch authorization
  const loginBody = {
    email: joinBody.email,
    password: "SecurePassword123!",
  } satisfies IShoppingMallMemberUser.ILogin;

  const loggedInUser = await api.functional.auth.memberUser.login(connection, {
    body: loginBody,
  });
  typia.assert(loggedInUser);

  // 3. Compose coupon log filters
  // Using the authenticated member user ID and a random UUID coupon ticket ID
  const couponTicketId = typia.random<string & tags.Format<"uuid">>();
  const customerId = authorizedUser.id;

  // 4. Perform paginated coupon log search with filters
  // First page, limit 10, filtering by coupon ticket id, customer id, and log type
  const filterBody1 = {
    shopping_mall_coupon_ticket_id: couponTicketId,
    used_by_customer_id: customerId,
    log_type: "usage",
    page: 1,
    limit: 10,
  } satisfies IShoppingMallCouponLog.IRequest;

  const page1 =
    await api.functional.shoppingMall.memberUser.couponLogs.indexCouponLogs(
      connection,
      {
        body: filterBody1,
      },
    );
  typia.assert(page1);
  TestValidator.predicate(
    "page1 data length <= limit",
    page1.data.length <= 10,
  );
  // verify all coupon logs have the expected coupon_ticket_id and customer id
  for (const log of page1.data) {
    TestValidator.equals(
      "log coupon ticket id equals filter",
      log.shopping_mall_coupon_ticket_id,
      couponTicketId,
    );
    // used_by_customer_id can be nullable, so check first
    if (
      log.used_by_customer_id !== null &&
      log.used_by_customer_id !== undefined
    ) {
      TestValidator.equals(
        "log used by customer id equals filter",
        log.used_by_customer_id,
        customerId,
      );
    }
    TestValidator.equals("log type is usage", log.log_type, "usage");
  }

  // 5. Perform second paginated coupon log search with a different filter
  // Filter by log_type "issuance" only, page 2, limit 3
  const filterBody2 = {
    log_type: "issuance",
    page: 2,
    limit: 3,
  } satisfies IShoppingMallCouponLog.IRequest;

  const page2 =
    await api.functional.shoppingMall.memberUser.couponLogs.indexCouponLogs(
      connection,
      {
        body: filterBody2,
      },
    );
  typia.assert(page2);
  TestValidator.predicate("page2 data length <= limit", page2.data.length <= 3);
  for (const log of page2.data) {
    TestValidator.equals("log type is issuance", log.log_type, "issuance");
  }

  // 6. Perform coupon log search with date range filters
  const dateFrom = new Date(Date.now() - 24 * 3600 * 1000).toISOString(); // 24h ago
  const dateTo = new Date().toISOString(); // now

  const filterBody3 = {
    logged_at_from: dateFrom,
    logged_at_to: dateTo,
    page: 1,
    limit: 5,
  } satisfies IShoppingMallCouponLog.IRequest;

  const page3 =
    await api.functional.shoppingMall.memberUser.couponLogs.indexCouponLogs(
      connection,
      {
        body: filterBody3,
      },
    );
  typia.assert(page3);
  TestValidator.predicate("page3 data length <= limit", page3.data.length <= 5);
  for (const log of page3.data) {
    // log date between from and to
    TestValidator.predicate(
      `log logged_at within range ${dateFrom} - ${dateTo}`,
      log.logged_at >= dateFrom && log.logged_at <= dateTo,
    );
  }

  // 7. Error test: Attempt to call without authorization
  // For this, create a new connection with empty headers
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized access should fail", async () => {
    await api.functional.shoppingMall.memberUser.couponLogs.indexCouponLogs(
      unauthConn,
      {
        body: filterBody1,
      },
    );
  });
}
