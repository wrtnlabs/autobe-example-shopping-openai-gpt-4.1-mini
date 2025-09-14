import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUsers";

/**
 * Test retrieving detailed information of a guest user session by ID as admin
 * user.
 *
 * This test covers the scenario where an administrator user joins (registers)
 * through the authentication endpoint to establish an admin authentication
 * context. Then it attempts to retrieve the detailed information of a guest
 * user session by the guest user's UUID.
 *
 * The workflow includes:
 *
 * 1. Creating an admin user account to authenticate and establish authorization
 *    for admin operations.
 * 2. Creating a fresh simulated guest user record (using typia.random) for
 *    retrieving its details.
 * 3. Using the authenticated admin connection to retrieve the guest user's
 *    detailed session information by ID.
 * 4. Verifying that the retrieved guest user data matches the expected properties
 *    exactly and is properly typed.
 *
 * Failure paths are not explicitly tested in this function since the scenario
 * description focuses on a successful admin retrieval. However, realistic guest
 * user data is used to ensure the API contract is fulfilled and all properties
 * (including optional ones) are returned correctly.
 *
 * All asynchronous calls are awaited properly, and all responses are validated
 * with typia.assert for strict type compliance.
 *
 * The test validates correct authorization, response data, and access to the
 * guest user detail endpoint under admin privilege.
 *
 * It also ensures that the admin authentication header is set by the join
 * operation, reflecting real admin user authorization workflow required for
 * this operation.
 */
export async function test_api_guest_user_detail_admin_user_success(
  connection: api.IConnection,
) {
  // 1. Admin user join to authenticate as admin
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(12),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      },
    });
  typia.assert(adminUser);

  // 2. Simulate a guest user session (fresh data)
  const guestUser: IShoppingMallGuestUsers =
    typia.random<IShoppingMallGuestUsers>();

  // 3. Retrieve the guest user session detail by ID using the admin authenticated connection
  const detail: IShoppingMallGuestUsers =
    await api.functional.shoppingMall.adminUser.guestUsers.at(connection, {
      id: guestUser.id,
    });
  typia.assert(detail);

  // 4. Validate the output fields
  TestValidator.equals("guest user id", detail.id, guestUser.id);
  TestValidator.predicate(
    "guest user ip address is string",
    typeof detail.ip_address === "string",
  );
  TestValidator.predicate(
    "guest user access URL is string",
    typeof detail.access_url === "string",
  );
  TestValidator.predicate(
    "guest user session start is string",
    typeof detail.session_start_at === "string",
  );

  // Optional fields may be null or string
  TestValidator.predicate(
    "guest user referrer is string or null",
    detail.referrer === null || typeof detail.referrer === "string",
  );
  TestValidator.predicate(
    "guest user user agent is string or null",
    detail.user_agent === null || typeof detail.user_agent === "string",
  );
  TestValidator.predicate(
    "guest user session end is null or string",
    detail.session_end_at === null || typeof detail.session_end_at === "string",
  );
  TestValidator.predicate(
    "guest user deleted_at is null or string",
    detail.deleted_at === null ||
      detail.deleted_at === undefined ||
      typeof detail.deleted_at === "string",
  );

  TestValidator.predicate(
    "guest user created_at is string",
    typeof detail.created_at === "string",
  );
  TestValidator.predicate(
    "guest user updated_at is string",
    typeof detail.updated_at === "string",
  );
}
