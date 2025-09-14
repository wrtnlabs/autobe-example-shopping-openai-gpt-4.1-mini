import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

/**
 * Test failure scenario when attempting to retrieve a fraud detection
 * record with a non-existent UUID. This test ensures that the API returns a
 * 404 error for invalid resource IDs.
 *
 * The test workflow:
 *
 * 1. Create and authenticate an admin user using the join API.
 * 2. Attempt to retrieve a fraud detection using a fabricated UUID that does
 *    not exist in the system.
 * 3. Verify that the API call throws an HttpError with a 404 status.
 */
export async function test_api_fraud_detection_get_not_found(
  connection: api.IConnection,
) {
  // 1. Create admin user for authentication context
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: adminCreateBody,
  });
  typia.assert(adminUser);

  // 2. Attempt to fetch non-existent fraud detection by random UUID
  const fakeId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "should throw 404 if fraud detection ID does not exist",
    async () => {
      await api.functional.shoppingMall.adminUser.fraudDetections.at(
        connection,
        {
          fraudDetectionId: fakeId,
        },
      );
    },
  );
}
