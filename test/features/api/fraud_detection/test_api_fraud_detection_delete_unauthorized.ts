import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallFraudDetection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFraudDetection";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Verify unauthorized deletion protection for fraud detection records.
 *
 * This test confirms that a member user without administrative privileges
 * cannot delete fraud detection records. The full flow includes:
 *
 * 1. Join an admin user (necessary for permissions and creating fraud
 *    detection).
 * 2. Join a member user (represents unauthorized user).
 * 3. Logging in or authenticating is handled automatically by SDK when
 *    joining.
 * 4. The admin user creates a fraud detection record.
 * 5. Switch authentication to the member user.
 * 6. Attempt to delete the fraud detection record with the member user.
 * 7. Confirm that deletion fails with an authorization error.
 *
 * Ensures proper authorization enforcement and protects sensitive fraud
 * data.
 */
export async function test_api_fraud_detection_delete_unauthorized(
  connection: api.IConnection,
) {
  // 1. Create an admin user and authenticate
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a member user for unauthorized context
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Admin user creates a fraud detection record
  const fraudDetectionCreateBody = {
    user_id: memberUser.id,
    order_id: null,
    detection_type: "payment_fraud",
    confidence_score: 0.95,
    resolution_status: "pending",
    details: "Suspected payment fraud detected via AI system.",
    detected_at: new Date().toISOString(),
  } satisfies IShoppingMallFraudDetection.ICreate;

  const fraudDetection: IShoppingMallFraudDetection =
    await api.functional.shoppingMall.adminUser.fraudDetections.create(
      connection,
      { body: fraudDetectionCreateBody },
    );
  typia.assert(fraudDetection);

  // 4. Switch to member user authentication context
  await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberUserEmail,
      password_hash: "1234",
      nickname: memberUser.nickname,
      full_name: memberUser.full_name,
      phone_number: memberUser.phone_number,
      status: memberUser.status,
    } satisfies IShoppingMallMemberUser.ICreate,
  });

  // 5. Attempt deletion by unauthorized member user
  await TestValidator.error(
    "unauthorized user cannot delete fraud detection",
    async () => {
      await api.functional.shoppingMall.adminUser.fraudDetections.erase(
        connection,
        { fraudDetectionId: fraudDetection.id },
      );
    },
  );
}
