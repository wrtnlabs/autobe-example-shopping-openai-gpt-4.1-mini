import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";

/**
 * Test detailed mileage record retrieval by admin user.
 *
 * This E2E test covers:
 *
 * 1. Admin user creation and login via join.
 * 2. Successful retrieval of existing mileage record by ID.
 * 3. Unauthorized access rejection.
 * 4. Querying non-existent mileage record yields error.
 */
export async function test_api_mileage_admin_retrieve_detail_success_and_authorization_error(
  connection: api.IConnection,
) {
  // Step 1: Admin user creation and authentication
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // Step 2: Retrieve a mileage detail successfully
  const mileageSample: IShoppingMallMileage =
    typia.random<IShoppingMallMileage>();

  // We invoke fetching endpoint with mileageSample.id
  const mileageDetail: IShoppingMallMileage =
    await api.functional.shoppingMall.adminUser.mileages.at(connection, {
      mileageId: mileageSample.id,
    });
  typia.assert(mileageDetail);

  TestValidator.equals(
    "Retrieved mileage detail ID matches requested ID",
    mileageDetail.id,
    mileageSample.id,
  );

  // Step 3: Unauthorized access must fail
  // Use a new connection with empty headers for unauthorized
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "Unauthorized mileage detail retrieval should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.mileages.at(unauthConn, {
        mileageId: mileageSample.id,
      });
    },
  );

  // Step 4: Query non-existent mileage id returns error
  // Generate valid uuid unlikely to exist
  let nonExistentId = typia.random<string & tags.Format<"uuid">>();
  // Defensive: regenerate if collision occurs
  while (nonExistentId === mileageSample.id) {
    nonExistentId = typia.random<string & tags.Format<"uuid">>();
  }

  await TestValidator.error(
    "Retrieving non-existent mileage ID should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.mileages.at(connection, {
        mileageId: nonExistentId,
      });
    },
  );
}
