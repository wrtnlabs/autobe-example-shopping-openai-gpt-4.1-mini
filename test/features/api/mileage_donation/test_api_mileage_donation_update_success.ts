import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";

/**
 * Validate successful update of a mileage donation record.
 *
 * This test covers the full business flow:
 *
 * 1. Create an admin user and authenticate them.
 * 2. Create a member user.
 * 3. Create a mileage donation record from the admin to the member user.
 * 4. Update the mileage donation's donation_reason and donation_amount.
 * 5. Validate all fields for correctness post-update.
 * 6. Ensure updated_at timestamp reflects the update.
 *
 * The test confirms the authorization, data integrity, and business rules
 * around mileage donation updates.
 */
export async function test_api_mileage_donation_update_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user and authenticate
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: "admin_password_123",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a member user
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "member_password_123",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create a mileage donation by the admin user to the member
  const now = new Date();
  const donationCreateBody = {
    adminuser_id: adminUser.id,
    memberuser_id: memberUser.id,
    donation_reason: "Initial promotional donation",
    donation_amount: 100.0,
    donation_date: now.toISOString(),
  } satisfies IShoppingMallMileageDonation.ICreate;

  const createdDonation: IShoppingMallMileageDonation =
    await api.functional.shoppingMall.adminUser.mileageDonations.create(
      connection,
      {
        body: donationCreateBody,
      },
    );
  typia.assert(createdDonation);

  TestValidator.equals(
    "adminuser_id matches",
    createdDonation.adminuser_id,
    adminUser.id,
  );
  TestValidator.equals(
    "memberuser_id matches",
    createdDonation.memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "donation_reason matches",
    createdDonation.donation_reason,
    donationCreateBody.donation_reason,
  );
  TestValidator.equals(
    "donation_amount matches",
    createdDonation.donation_amount,
    donationCreateBody.donation_amount,
  );
  TestValidator.equals(
    "donation_date matches",
    createdDonation.donation_date,
    donationCreateBody.donation_date,
  );

  // 4. Prepare update data for mileage donation
  const updateDonationReason = "Updated reason due to campaign extension";
  const updateDonationAmount = 150.5;

  const updateBody = {
    donation_reason: updateDonationReason,
    donation_amount: updateDonationAmount,
  } satisfies IShoppingMallMileageDonation.IUpdate;

  // Wait a moment to ensure updated_at timestamp will change
  await new Promise((resolve) => setTimeout(resolve, 10));

  // 5. Perform the update
  const updatedDonation: IShoppingMallMileageDonation =
    await api.functional.shoppingMall.adminUser.mileageDonations.update(
      connection,
      {
        mileageDonationId: createdDonation.id satisfies string &
          tags.Format<"uuid">,
        body: updateBody,
      },
    );
  typia.assert(updatedDonation);

  // 6. Validate update result
  TestValidator.equals(
    "id remains same",
    updatedDonation.id,
    createdDonation.id,
  );
  TestValidator.equals(
    "adminuser_id remains same",
    updatedDonation.adminuser_id,
    createdDonation.adminuser_id,
  );
  TestValidator.equals(
    "memberuser_id remains same",
    updatedDonation.memberuser_id,
    createdDonation.memberuser_id,
  );
  TestValidator.equals(
    "donation_reason updated",
    updatedDonation.donation_reason,
    updateDonationReason,
  );
  TestValidator.equals(
    "donation_amount updated",
    updatedDonation.donation_amount,
    updateDonationAmount,
  );
  TestValidator.equals(
    "donation_date remains same",
    updatedDonation.donation_date,
    createdDonation.donation_date,
  );

  TestValidator.predicate(
    "updated_at timestamp changed",
    new Date(updatedDonation.updated_at).getTime() >
      new Date(createdDonation.updated_at).getTime(),
  );
}
