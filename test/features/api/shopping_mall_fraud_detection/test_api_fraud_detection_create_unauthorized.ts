import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

/**
 * Test creation of a fraud detection record without proper authentication.
 *
 * The test attempts to create a fraud detection record payload without
 * establishing admin authentication context. It confirms that the API denies
 * access and throws an authorization error, validating correct security
 * enforcement.
 *
 * The preliminary admin join operation sets up the admin user account, but the
 * connection used for the main API call remains unauthenticated.
 *
 * Workflow:
 *
 * 1. Create an admin user account via join.
 * 2. Generate fraud detection creation payload with realistic data.
 * 3. Attempt to create fraud detection record without admin authentication.
 * 4. Expect and validate an authorization error thrown by the API.
 */
export async function test_api_fraud_detection_create_unauthorized(
  connection: api.IConnection,
) {
  // 1. Create an admin user account without authenticating the connection
  const adminUserData = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  await api.functional.auth.adminUser.join(connection, {
    body: adminUserData,
  });

  // 2. Generate fraud detection creation payload
  const fraudDetectionPayload =
    typia.random<IShoppingMallFraudDetection.ICreate>();

  // 3. Attempt unauthorized creation of fraud detection record
  await TestValidator.error(
    "Unauthorized fraud detection creation should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.fraudDetections.create(
        connection,
        {
          body: fraudDetectionPayload,
        },
      );
    },
  );
}
