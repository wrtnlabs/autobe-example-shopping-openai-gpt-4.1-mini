import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";

export async function test_api_fraud_detection_create_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  // 2. Prepare request data for fraud detection creation
  // 3. Call fraud detection creation API using authenticated connection
  // 4. Assert the returned fraud detection record

  // Step 1
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(32);
  const adminUserNickname = RandomGenerator.name(2);
  const adminUserFullName = RandomGenerator.name(3);
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Step 2
  // Confidence score strictly between 0 and 1.
  const confidenceScore = 0.000001 + Math.random() * (1 - 0.000002);

  const fraudDetectionRequestBody = {
    user_id: typia.random<string & tags.Format<"uuid">>(),
    order_id: typia.random<string & tags.Format<"uuid">>(),
    detection_type: RandomGenerator.pick([
      "payment_fraud",
      "account_takeover",
      "identity_theft",
      "chargeback",
      "refund_abuse",
    ] as const),
    confidence_score: confidenceScore,
    resolution_status: RandomGenerator.pick([
      "pending",
      "investigating",
      "resolved",
      "dismissed",
    ] as const),
    details: null,
    detected_at: new Date().toISOString(),
  } satisfies IShoppingMallFraudDetection.ICreate;

  // Step 3
  const response: IShoppingMallFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.create(
      connection,
      {
        body: fraudDetectionRequestBody,
      },
    );
  typia.assert(response);

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const iso8601Regex =
    /^[0-9]{4}-[01][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9](?:\.\d+)?Z$/i;

  // Step 4
  TestValidator.predicate("response.id is UUID", uuidRegex.test(response.id));
  TestValidator.equals(
    "response.user_id matches request user_id",
    response.user_id,
    fraudDetectionRequestBody.user_id,
  );
  TestValidator.equals(
    "response.order_id matches request order_id",
    response.order_id,
    fraudDetectionRequestBody.order_id,
  );
  TestValidator.equals(
    "response.detection_type matches request detection_type",
    response.detection_type,
    fraudDetectionRequestBody.detection_type,
  );
  TestValidator.predicate(
    "response.confidence_score between 0 and 1",
    response.confidence_score > 0 && response.confidence_score < 1,
  );
  TestValidator.equals(
    "response.resolution_status matches request resolution_status",
    response.resolution_status,
    fraudDetectionRequestBody.resolution_status,
  );
  TestValidator.equals(
    "response.details matches request details",
    response.details,
    fraudDetectionRequestBody.details,
  );
  TestValidator.equals(
    "response.detected_at matches request detected_at",
    response.detected_at,
    fraudDetectionRequestBody.detected_at,
  );
  TestValidator.predicate(
    "response.created_at is ISO8601 datetime",
    iso8601Regex.test(response.created_at),
  );
  TestValidator.predicate(
    "response.updated_at is ISO8601 datetime",
    iso8601Regex.test(response.updated_at),
  );
  TestValidator.predicate(
    "response.deleted_at is undefined or null",
    response.deleted_at === undefined || response.deleted_at === null,
  );
}
