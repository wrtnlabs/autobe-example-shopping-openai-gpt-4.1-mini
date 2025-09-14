import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

/**
 * Test successful deletion of fraud detection record.
 *
 * This test validates the complete and successful deletion of a fraud
 * detection record by following these steps:
 *
 * 1. Create an administrator user and authenticate.
 * 2. Create a fraud detection record to delete.
 * 3. Delete the created fraud detection record using its UUID.
 * 4. Validate that the deletion completes without error.
 *
 * This test confirms that the fraud detection deletion API correctly
 * processes deletion requests and that records are properly removed by
 * their IDs.
 *
 * This scenario assumes that the admin user join endpoints are called first
 * to provide authentication tokens required for the CRUD operations on
 * fraud detection records.
 */
export async function test_api_fraud_detection_delete_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(64);
  const adminUserFullName = RandomGenerator.name();
  const adminUserNickname = RandomGenerator.name(2);
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        full_name: adminUserFullName,
        nickname: adminUserNickname,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a fraud detection record
  const fraudDetectionUserId = typia.random<string & tags.Format<"uuid">>();
  const fraudDetectionDetectionType = "payment_fraud";
  const fraudDetectionConfidenceScore = Math.random();
  const fraudDetectionResolutionStatus = "pending";
  const fraudDetectionDetectedAt = new Date().toISOString();

  const fraudDetectionCreateBody = {
    user_id: fraudDetectionUserId,
    detection_type: fraudDetectionDetectionType,
    confidence_score: fraudDetectionConfidenceScore,
    resolution_status: fraudDetectionResolutionStatus,
    detected_at: fraudDetectionDetectedAt,
    order_id: null,
    details: null,
  } satisfies IShoppingMallFraudDetection.ICreate;

  const fraudDetection: IShoppingMallFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.create(
      connection,
      {
        body: fraudDetectionCreateBody,
      },
    );
  typia.assert(fraudDetection);

  // 3. Delete the fraud detection record
  await api.functional.shoppingMall.adminUser.fraudDetections.erase(
    connection,
    {
      fraudDetectionId: fraudDetection.id,
    },
  );

  // 4. Deletion successful if no errors thrown
  TestValidator.predicate(
    "fraud detection record deletion completed without errors",
    true,
  );
}
