import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrderAuditLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderAuditLog";

/**
 * Validates retrieving a single order audit log for an authenticated member
 * user.
 *
 * The test consists of the following steps:
 *
 * 1. Register a new member user with all required properties.
 * 2. Login as that member user to obtain authorization credentials.
 * 3. Retrieve a single order audit log using a valid UUID.
 * 4. Assert that the order audit log data matches the requested log ID and
 *    meets all format and business requirements.
 */
export async function test_api_order_audit_logs_at_memberuser_success(
  connection: api.IConnection,
) {
  // Step 1: Register member user
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile() as string | null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const joinedUser = await api.functional.auth.memberUser.join(connection, {
    body: joinBody,
  });
  typia.assert(joinedUser);

  // Step 2: Login member user
  const loginBody = {
    email: joinedUser.email as string & tags.Format<"email">,
    password: joinBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;
  const loggedInUser = await api.functional.auth.memberUser.login(connection, {
    body: loginBody,
  });
  typia.assert(loggedInUser);

  // Step 3: Retrieve order audit log
  const auditLogId = typia.random<string & tags.Format<"uuid">>();
  const auditLog =
    await api.functional.shoppingMall.memberUser.orderAuditLogs.atOrderAuditLog(
      connection,
      { id: auditLogId },
    );
  typia.assert(auditLog);

  // Assertions to validate returned data
  TestValidator.equals("audit log id matches request", auditLog.id, auditLogId);
  TestValidator.predicate(
    "performed_at is ISO 8601 date-time",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,})?Z$/.test(
      auditLog.performed_at,
    ),
  );
  TestValidator.predicate(
    "action is non-empty string",
    typeof auditLog.action === "string" && auditLog.action.length > 0,
  );
}
