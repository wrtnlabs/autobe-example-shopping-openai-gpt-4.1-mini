import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

/**
 * Validate updating a fraud detection record with valid data.
 *
 * This test validates the end-to-end flow of updating an existing fraud
 * detection record as an authenticated admin user. It performs:
 *
 * 1. Admin user creation to obtain authentication context.
 * 2. Creation of an initial fraud detection record with valid data.
 * 3. Update of the fraud detection record with new valid details.
 *
 * The test verifies the update response is valid and that the returned
 * fraud detection record reflects all updated values correctly. It uses
 * typia.assert to validate data shapes and TestValidator to check exact
 * field values.
 *
 * This scenario ensures that authorized updates work successfully with the
 * expected data flow.
 */
export async function test_api_fraud_detection_update_valid_data(
  connection: api.IConnection,
) {
  // Step 1: Admin user creation and login
  const adminCreateBody = {
    email: `${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // Step 2: Create initial fraud detection record
  const fraudDetectionCreateBody = {
    user_id: typia.random<string & tags.Format<"uuid">>(),
    order_id: typia.random<string & tags.Format<"uuid">>(),
    detection_type: "payment_fraud",
    confidence_score: 0.85,
    resolution_status: "pending",
    details: "Initial detection of suspicious payment activity.",
    detected_at: new Date().toISOString(),
  } satisfies IShoppingMallFraudDetection.ICreate;

  const fraudDetection: IShoppingMallFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.create(
      connection,
      {
        body: fraudDetectionCreateBody,
      },
    );
  typia.assert(fraudDetection);

  // Step 3: Update the fraud detection record with valid new data
  const updateBody = {
    detection_type: "account_takeover",
    confidence_score: 0.92,
    resolution_status: "investigating",
    details: "Updated detection to account takeover with high confidence.",
    detected_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
  } satisfies IShoppingMallFraudDetection.IUpdate;

  const updatedFraudDetection: IShoppingMallFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.update(
      connection,
      {
        fraudDetectionId: fraudDetection.id,
        body: updateBody,
      },
    );
  typia.assert(updatedFraudDetection);

  // Step 4: Validate that the updated record matches the update input
  TestValidator.equals(
    "updated detection_type should match",
    updatedFraudDetection.detection_type,
    updateBody.detection_type!,
  );
  TestValidator.equals(
    "updated confidence_score should match",
    updatedFraudDetection.confidence_score,
    updateBody.confidence_score!,
  );
  TestValidator.equals(
    "updated resolution_status should match",
    updatedFraudDetection.resolution_status,
    updateBody.resolution_status!,
  );
  TestValidator.equals(
    "updated details should match",
    updatedFraudDetection.details,
    updateBody.details!,
  );
  TestValidator.equals(
    "updated detected_at should match",
    updatedFraudDetection.detected_at,
    updateBody.detected_at!,
  );
}
