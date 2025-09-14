import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUsers";

/**
 * Test success case for updating a guest user session, including updating
 * IP address, access URL, referrer, user agent, session start and end
 * timestamps. Verify that the update is successful with valid UUID for
 * guest user ID and proper ISO 8601 timestamps. Ensure the admin user
 * authentication context is established before the update operation.
 */
export async function test_api_guest_user_update_success(
  connection: api.IConnection,
) {
  // 1. Create admin user with realistic data
  const email = typia.random<string & tags.Format<"email">>();
  const passwordHash = RandomGenerator.alphaNumeric(64); // realistic hashed password
  const nickname = RandomGenerator.name();
  const fullName = RandomGenerator.name(2);
  const status = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email,
        password_hash: passwordHash,
        nickname,
        full_name: fullName,
        status,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Login as admin user to establish authentication context
  const loginUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email,
        password_hash: passwordHash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loginUser);

  // 3. Generate guest user UUID
  const guestUserId = typia.random<string & tags.Format<"uuid">>();

  // 4. Construct update payload with realistic data
  const updateBody = {
    ip_address: "203.0.113." + RandomGenerator.alphaNumeric(1),
    access_url: "https://www.example.com/landing",
    referrer: null,
    user_agent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
    session_start_at: new Date(Date.now() - 3600000).toISOString(),
    session_end_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  } satisfies IShoppingMallGuestUsers.IUpdate;

  // 5. Call update API with guest user ID and update payload
  const updatedGuestUser: IShoppingMallGuestUsers =
    await api.functional.shoppingMall.adminUser.guestUsers.update(connection, {
      id: guestUserId,
      body: updateBody,
    });
  typia.assert(updatedGuestUser);

  // 6. Validate returned values
  TestValidator.equals(
    "updated guest user id matches",
    updatedGuestUser.id,
    guestUserId,
  );
  TestValidator.equals(
    "ip address matches",
    updatedGuestUser.ip_address,
    updateBody.ip_address,
  );
  TestValidator.equals(
    "access URL matches",
    updatedGuestUser.access_url,
    updateBody.access_url,
  );
  TestValidator.equals(
    "referrer matches null",
    updatedGuestUser.referrer,
    null,
  );
  TestValidator.equals(
    "user agent matches",
    updatedGuestUser.user_agent,
    updateBody.user_agent,
  );
  TestValidator.equals(
    "session start timestamp matches",
    updatedGuestUser.session_start_at,
    updateBody.session_start_at,
  );
  TestValidator.equals(
    "session end timestamp matches",
    updatedGuestUser.session_end_at,
    updateBody.session_end_at,
  );
  TestValidator.equals(
    "created_at matches",
    updatedGuestUser.created_at,
    updateBody.created_at,
  );
  TestValidator.equals(
    "updated_at matches",
    updatedGuestUser.updated_at,
    updateBody.updated_at,
  );
  TestValidator.equals(
    "deleted_at matches null",
    updatedGuestUser.deleted_at,
    null,
  );

  // 7. Additional format validations
  typia.assert<string & tags.Format<"uuid">>(updatedGuestUser.id);
  typia.assert<string & tags.Format<"date-time">>(
    updatedGuestUser.session_start_at,
  );
  typia.assert<string & tags.Format<"date-time">>(
    updatedGuestUser.session_end_at!,
  );
  typia.assert<string & tags.Format<"date-time">>(updatedGuestUser.created_at);
  typia.assert<string & tags.Format<"date-time">>(updatedGuestUser.updated_at);
  if (
    updatedGuestUser.deleted_at !== null &&
    updatedGuestUser.deleted_at !== undefined
  ) {
    typia.assert<string & tags.Format<"date-time">>(
      updatedGuestUser.deleted_at,
    );
  }
}
