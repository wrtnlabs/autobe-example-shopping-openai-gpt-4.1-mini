import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";

/**
 * Validate the creation of mileage records by an admin user, including
 * success and validation failure scenarios.
 *
 * Business context: Administrative users must be authenticated before
 * creating mileage records which link to either guest or member users,
 * tracking balances and usage. This test covers the full flow of admin user
 * joining and authenticating, then creating mileage records with valid
 * data, verifying data integrity, and checking error responses when
 * required fields are omitted or invalid.
 *
 * Steps:
 *
 * 1. Admin user joins and authenticates
 * 2. Successfully create mileage record with correct inputs
 * 3. Assert response matches inputs and includes generated IDs and timestamps
 * 4. Attempt to create mileage record missing required fields and expect
 *    errors
 * 5. Attempt to create mileage record with invalid numeric values and expect
 *    errors
 *
 * All API calls use exact DTO types, typia.assert validation, random
 * realistic data generation, and proper async/await usage.
 */
export async function test_api_mileage_admin_create_success_and_validation_fail(
  connection: api.IConnection,
) {
  // 1. Admin user joins and authenticates
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Successful mileage creation with valid data
  // Prepare mileage create body with either guestuser_id or memberuser_id set
  const guestUserId = typia.random<string & tags.Format<"uuid">>();
  const memberUserId = null;
  const validMileageCreateBody = {
    guestuser_id: guestUserId,
    memberuser_id: memberUserId, // explicit null
    mileage_balance: RandomGenerator.alphaNumeric(1).length + 100, // a positive number > 100
    mileage_income: 500,
    mileage_outcome: 200,
    mileage_expired: 50,
  } satisfies IShoppingMallMileage.ICreate;

  const mileage: IShoppingMallMileage =
    await api.functional.shoppingMall.adminUser.mileages.create(connection, {
      body: validMileageCreateBody,
    });
  typia.assert(mileage);

  TestValidator.equals(
    "mileage guestuser_id equals input",
    mileage.guestuser_id,
    validMileageCreateBody.guestuser_id,
  );
  TestValidator.equals(
    "mileage memberuser_id equals input",
    mileage.memberuser_id,
    validMileageCreateBody.memberuser_id,
  );
  TestValidator.equals(
    "mileage_balance equals input",
    mileage.mileage_balance,
    validMileageCreateBody.mileage_balance,
  );
  TestValidator.equals(
    "mileage_income equals input",
    mileage.mileage_income,
    validMileageCreateBody.mileage_income,
  );
  TestValidator.equals(
    "mileage_outcome equals input",
    mileage.mileage_outcome,
    validMileageCreateBody.mileage_outcome,
  );
  TestValidator.equals(
    "mileage_expired equals input",
    mileage.mileage_expired,
    validMileageCreateBody.mileage_expired,
  );

  TestValidator.predicate(
    "mileage id is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      mileage.id,
    ),
  );
  TestValidator.predicate(
    "mileage created_at is ISO string",
    typeof mileage.created_at === "string" && mileage.created_at.length > 0,
  );
  TestValidator.predicate(
    "mileage updated_at is ISO string",
    typeof mileage.updated_at === "string" && mileage.updated_at.length > 0,
  );

  // 4. Error scenario: missing required fields should throw error
  const missingRequiredFields = {
    // Omit mileage_balance which is required
    guestuser_id: typia.random<string & tags.Format<"uuid">>(),
    memberuser_id: null,
    mileage_income: 300,
    mileage_outcome: 100,
    mileage_expired: 20,
  };
  await TestValidator.error(
    "missing required field mileage_balance should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.mileages.create(connection, {
        body: missingRequiredFields as any, // cast to any to bypass TS error for test
      });
    },
  );

  // 5. Error scenario: invalid numeric values (negative, excessive) should throw error
  const invalidValuesList: IShoppingMallMileage.ICreate[] = [
    {
      guestuser_id: typia.random<string & tags.Format<"uuid">>(),
      memberuser_id: null,
      mileage_balance: -100, // negative value
      mileage_income: 100,
      mileage_outcome: 50,
      mileage_expired: 10,
    },
    {
      guestuser_id: null,
      memberuser_id: typia.random<string & tags.Format<"uuid">>(),
      mileage_balance: 100,
      mileage_income: -10, // negative value
      mileage_outcome: 10,
      mileage_expired: 0,
    },
    {
      guestuser_id: null,
      memberuser_id: typia.random<string & tags.Format<"uuid">>(),
      mileage_balance: 100,
      mileage_income: 1000,
      mileage_outcome: -5, // negative value
      mileage_expired: 5,
    },
    {
      guestuser_id: typia.random<string & tags.Format<"uuid">>(),
      memberuser_id: null,
      mileage_balance: 100,
      mileage_income: 500,
      mileage_outcome: 100,
      mileage_expired: -1, // negative value
    },
  ];

  for (const invalidBody of invalidValuesList) {
    await TestValidator.error(
      "invalid numeric value in mileage create should fail",
      async () => {
        await api.functional.shoppingMall.adminUser.mileages.create(
          connection,
          {
            body: invalidBody,
          },
        );
      },
    );
  }
}
