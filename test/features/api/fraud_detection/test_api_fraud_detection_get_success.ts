import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

/**
 * Test retrieving a fraud detection record successfully by its valid ID.
 *
 * This test covers the entire workflow including admin user creation,
 * authentication, fraud detection record creation, and retrieval. It
 * verifies that the retrieved record matches the created data in all
 * fields.
 *
 * Steps:
 *
 * 1. Create a new admin user with realistic data and authenticate.
 * 2. Create a new fraud detection record with valid user_id, order_id,
 *    detection_type, confidence_score, resolution_status, details, and
 *    detection time.
 * 3. Retrieve the fraud detection record by its ID.
 * 4. Validate all response fields match the created record exactly including
 *    timestamps and nullable fields.
 * 5. Confirm no additional or missing properties and that all format
 *    constraints are preserved.
 */
export async function test_api_fraud_detection_get_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: RandomGenerator.alphaNumeric(32),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 2. Create fraud detection record
  const fraudDetectionBody = {
    user_id: typia.random<string & tags.Format<"uuid">>(),
    order_id: typia.random<string & tags.Format<"uuid">>(),
    detection_type: "payment_fraud",
    confidence_score: Math.min(Math.max(typia.random<number>(), 0), 1),
    resolution_status: "pending",
    details: RandomGenerator.paragraph({ sentences: 5 }),
    detected_at: new Date().toISOString(),
  } satisfies IShoppingMallFraudDetection.ICreate;

  const createdFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.create(
      connection,
      { body: fraudDetectionBody },
    );
  typia.assert(createdFraudDetection);

  // 3. Retrieve the fraud detection record by ID
  const retrievedFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.at(connection, {
      fraudDetectionId: createdFraudDetection.id,
    });
  typia.assert(retrievedFraudDetection);

  // 4. Validate all fields
  TestValidator.equals(
    "id",
    retrievedFraudDetection.id,
    createdFraudDetection.id,
  );
  TestValidator.equals(
    "user_id",
    retrievedFraudDetection.user_id,
    createdFraudDetection.user_id,
  );
  TestValidator.equals(
    "order_id",
    retrievedFraudDetection.order_id,
    createdFraudDetection.order_id,
  );
  TestValidator.equals(
    "detection_type",
    retrievedFraudDetection.detection_type,
    createdFraudDetection.detection_type,
  );
  TestValidator.equals(
    "confidence_score",
    retrievedFraudDetection.confidence_score,
    createdFraudDetection.confidence_score,
  );
  TestValidator.equals(
    "resolution_status",
    retrievedFraudDetection.resolution_status,
    createdFraudDetection.resolution_status,
  );
  TestValidator.equals(
    "details",
    retrievedFraudDetection.details,
    createdFraudDetection.details,
  );
  TestValidator.equals(
    "detected_at",
    retrievedFraudDetection.detected_at,
    createdFraudDetection.detected_at,
  );
  TestValidator.predicate(
    "created_at presence",
    typeof retrievedFraudDetection.created_at === "string",
  );
  TestValidator.predicate(
    "updated_at presence",
    typeof retrievedFraudDetection.updated_at === "string",
  );
  TestValidator.equals("deleted_at", retrievedFraudDetection.deleted_at, null);
}
