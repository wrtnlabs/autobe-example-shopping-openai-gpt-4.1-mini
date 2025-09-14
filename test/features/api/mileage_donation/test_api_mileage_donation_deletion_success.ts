import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";

/**
 * Test deleting a mileage donation record by an admin user.
 *
 * This test covers the entire workflow of creating an admin user, creating a
 * member user, creating a mileage donation record by the admin to the member,
 * and then deleting the mileage donation record by ID. It validates the
 * successful creation of all entities, enforces type safety through typia
 * assertions, and ensures that the deletion operation completes without
 * errors.
 *
 * The deletion operation is performed in an authorized context provided by the
 * admin user. The test does not cover unauthorized deletion attempts or invalid
 * ID errors.
 *
 * Steps:
 *
 * 1. Create a new admin user with realistic details.
 * 2. Create a new member user with realistic details.
 * 3. Create a mileage donation record linking the admin and member users.
 * 4. Delete the created mileage donation record by its unique ID.
 * 5. Confirm the deletion call completes without exceptions.
 */
export async function test_api_mileage_donation_deletion_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create member user
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create mileage donation
  const mileageDonation: IShoppingMallMileageDonation =
    await api.functional.shoppingMall.adminUser.mileageDonations.create(
      connection,
      {
        body: {
          adminuser_id: adminUser.id,
          memberuser_id: memberUser.id,
          donation_reason: RandomGenerator.paragraph({ sentences: 5 }),
          donation_amount: Math.random() * 1000 + 1, // positive float number
          donation_date: new Date().toISOString(),
        } satisfies IShoppingMallMileageDonation.ICreate,
      },
    );
  typia.assert(mileageDonation);

  // 4. Delete mileage donation by ID
  await api.functional.shoppingMall.adminUser.mileageDonations.erase(
    connection,
    {
      mileageDonationId: mileageDonation.id,
    },
  );

  // 5. Confirm deletion completed
}
