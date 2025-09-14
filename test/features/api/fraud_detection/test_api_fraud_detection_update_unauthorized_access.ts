import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test unauthorized update attempt on a fraud detection record.
 *
 * Ensures that a user without admin privileges cannot update fraud
 * detection records. The test performs these steps:
 *
 * 1. Create an admin user who is required to create the initial fraud
 *    detection record.
 * 2. Create a fraud detection record as the admin user.
 * 3. Create a member user to simulate a non-admin unauthorized user.
 * 4. Attempt to update the fraud detection record as the non-admin user,
 *    expecting an authorization error.
 *
 * This test validates proper access control enforcement and prevents
 * unauthorized modifications.
 */
export async function test_api_fraud_detection_update_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Create an admin user for privileged operations
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a fraud detection record as admin user
  const initialFraudDetectionBody = {
    user_id: typia.random<string & tags.Format<"uuid">>(),
    order_id: null,
    detection_type: "payment_fraud",
    confidence_score: 0.9,
    resolution_status: "pending",
    details: "Initial fraud detection record",
    detected_at: new Date().toISOString(),
  } satisfies IShoppingMallFraudDetection.ICreate;

  const fraudDetection: IShoppingMallFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.create(
      connection,
      {
        body: initialFraudDetectionBody,
      },
    );
  typia.assert(fraudDetection);

  // 3. Create a member user to simulate unauthorized user
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 4. Attempt update on fraud detection as non-admin member user - expect failure
  const updateBody = {
    resolution_status: "resolved",
    details: "Attempted unauthorized update",
  } satisfies IShoppingMallFraudDetection.IUpdate;

  await TestValidator.error(
    "Non-admin user should NOT be able to update fraud detection",
    async () => {
      await api.functional.shoppingMall.adminUser.fraudDetections.update(
        connection,
        {
          fraudDetectionId: fraudDetection.id,
          body: updateBody,
        },
      );
    },
  );
}
