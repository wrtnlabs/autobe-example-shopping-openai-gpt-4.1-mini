import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";

/**
 * Update an existing customer mileage record successfully with valid data. This
 * involves changing the mileage balance, income, outcome, and expired mileage
 * for the customer. The test should verify the update operation respects
 * authorization as admin user and properly modifies the mileage record
 * identified by mileageId.
 */
export async function test_api_mileage_update_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate to obtain admin token
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  // Construct valid admin user create payload
  const adminCreateBody = {
    email: adminUserEmail,
    password_hash: RandomGenerator.alphaNumeric(16), // hashed password simulation
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare mileage update data with realistic values
  const mileageId = typia.random<string & tags.Format<"uuid">>();

  const mileageUpdateBody = {
    guestuser_id: null, // nullable property explicitly set to null
    memberuser_id: null, // nullable property explicitly set to null
    mileage_balance: 1000, // fixed positive integer
    mileage_income: 500,
    mileage_outcome: 200,
    mileage_expired: 50,
  } satisfies IShoppingMallMileage.IUpdate;

  // 3. Perform the update API call as admin user
  const updatedMileage: IShoppingMallMileage =
    await api.functional.shoppingMall.adminUser.mileages.update(connection, {
      mileageId: mileageId,
      body: mileageUpdateBody,
    });
  typia.assert(updatedMileage);

  // 4. Validate that the returned mileage record includes the updated values
  TestValidator.equals(
    "mileage_balance updated",
    updatedMileage.mileage_balance,
    mileageUpdateBody.mileage_balance ?? updatedMileage.mileage_balance,
  );
  TestValidator.equals(
    "mileage_income updated",
    updatedMileage.mileage_income,
    mileageUpdateBody.mileage_income ?? updatedMileage.mileage_income,
  );
  TestValidator.equals(
    "mileage_outcome updated",
    updatedMileage.mileage_outcome,
    mileageUpdateBody.mileage_outcome ?? updatedMileage.mileage_outcome,
  );
  TestValidator.equals(
    "mileage_expired updated",
    updatedMileage.mileage_expired,
    mileageUpdateBody.mileage_expired ?? updatedMileage.mileage_expired,
  );

  // 5. Validate that nullable properties are preserved properly
  TestValidator.equals(
    "guestuser_id is null",
    updatedMileage.guestuser_id,
    null,
  );
  TestValidator.equals(
    "memberuser_id is null",
    updatedMileage.memberuser_id,
    null,
  );
}
