import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";

/**
 * Retrieve detailed information of a specific mileage donation record by
 * mileageDonationId as an admin user.
 *
 * The test begins by creating and authenticating an admin user with
 * realistic credentials. Then, it attempts to get the mileage donation
 * detail using a randomly generated valid UUID as mileageDonationId. The
 * response is asserted for type correctness and matching identifier. It
 * also verifies that unauthorized access (without admin login) is
 * rejected.
 */
export async function test_api_mileage_donations_admin_user_get_detail(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `admin${RandomGenerator.alphaNumeric(6)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate a random mileageDonationId
  const mileageDonationId = typia.random<string & tags.Format<"uuid">>();

  // 3. Attempt to retrieve mileage donation details as admin user
  const donationDetail: IShoppingMallMileageDonation =
    await api.functional.shoppingMall.adminUser.mileageDonations.at(
      connection,
      {
        mileageDonationId,
      },
    );
  typia.assert(donationDetail);

  // 4. Verify the returned detail has the requested mileageDonationId
  TestValidator.equals(
    "mileageDonationId equals",
    donationDetail.id,
    mileageDonationId,
  );

  // 5. Test unauthorized access by using an unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized access should fail", async () => {
    await api.functional.shoppingMall.adminUser.mileageDonations.at(
      unauthConn,
      {
        mileageDonationId,
      },
    );
  });
}
