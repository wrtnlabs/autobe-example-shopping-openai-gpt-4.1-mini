import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";

/**
 * Test creating a new mileage donation record by an admin user.
 *
 * This test performs a full end-to-end validation including:
 *
 * 1. Creating an admin user for authorization.
 * 2. Creating a member user as the donation beneficiary.
 * 3. Creating a mileage donation record with valid data.
 * 4. Verifying that the created record contains correct property mappings,
 *    timestamps, and links to the admin and member users.
 *
 * This ensures that the mileage donation creation workflow is functional,
 * secure, and type-safe.
 */
export async function test_api_mileage_donation_creation_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user with valid fields
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a member user with valid fields
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create a mileage donation record with valid details
  const donationReason = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 5,
    wordMax: 10,
  });
  const donationAmount = parseFloat((Math.random() * 1000 + 1).toFixed(2)); // Positive float > 0
  const donationDate = new Date().toISOString();

  const donation: IShoppingMallMileageDonation =
    await api.functional.shoppingMall.adminUser.mileageDonations.create(
      connection,
      {
        body: {
          adminuser_id: adminUser.id,
          memberuser_id: memberUser.id,
          donation_reason: donationReason,
          donation_amount: donationAmount,
          donation_date: donationDate,
        } satisfies IShoppingMallMileageDonation.ICreate,
      },
    );

  typia.assert(donation);

  // 4. Validate returned record fields
  TestValidator.equals(
    "adminuser_id matches",
    donation.adminuser_id,
    adminUser.id,
  );
  TestValidator.equals(
    "memberuser_id matches",
    donation.memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "donation_reason matches",
    donation.donation_reason,
    donationReason,
  );
  TestValidator.equals(
    "donation_amount matches",
    donation.donation_amount,
    donationAmount,
  );
  TestValidator.equals(
    "donation_date matches",
    donation.donation_date,
    donationDate,
  );
  TestValidator.predicate(
    "donation id is non-empty string",
    typeof donation.id === "string" && donation.id.length > 0,
  );
  TestValidator.predicate(
    "created_at is ISO datetime string",
    typeof donation.created_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(donation.created_at),
  );
  TestValidator.predicate(
    "updated_at is ISO datetime string",
    typeof donation.updated_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(donation.updated_at),
  );
}
