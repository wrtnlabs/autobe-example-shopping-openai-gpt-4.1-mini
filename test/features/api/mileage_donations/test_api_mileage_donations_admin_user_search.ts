import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallMileageDonation";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";

/**
 * Validate the admin user's capability to search mileage donations with
 * filters.
 *
 * This test verifies that an admin user can successfully retrieve filtered
 * and paginated mileage donation data from the system. It simulates the
 * joining of an admin user and then performs the search with a variety of
 * filters such as admin user ID, member user ID, donation date range, and
 * donation reason, while ensuring the pagination parameters are correctly
 * honored. The response is verified for completeness and correctness
 * against the search conditions.
 */
export async function test_api_mileage_donations_admin_user_search(
  connection: api.IConnection,
) {
  // 1. Create and authenticate an admin user
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const passwordHash = "ValidHashedPassword123!"; // Simplified as plain string for test
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: passwordHash,
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Prepare filter criteria for donations
  // Using some realistic filter values:
  // - adminuser_id: use the created admin user id
  // - memberuser_id: random UUID
  // - donation_reason: substring
  // - donation_date_start & donation_date_end: date range
  // - page: 1, limit: 10

  const filterRequest = {
    page: 1,
    limit: 10,
    adminuser_id: adminUser.id,
    memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    donation_reason: "bonus",
    donation_date_start: new Date(
      Date.now() - 7 * 24 * 3600 * 1000,
    ).toISOString(),
    donation_date_end: new Date().toISOString(),
  } satisfies IShoppingMallMileageDonation.IRequest;

  // 2. Call index API with filterRequest
  const pageResult: IPageIShoppingMallMileageDonation =
    await api.functional.shoppingMall.adminUser.mileageDonations.index(
      connection,
      {
        body: filterRequest,
      },
    );
  typia.assert(pageResult);

  // 3. Validate pagination info
  TestValidator.predicate(
    "page info current page should be 1",
    pageResult.pagination.current === 1,
  );
  TestValidator.predicate(
    "page info limit should be 10",
    pageResult.pagination.limit === 10,
  );
  TestValidator.predicate(
    "page info pages should be >= 0",
    pageResult.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "page info records should be >= 0",
    pageResult.pagination.records >= 0,
  );

  // 4. Validate data elements match filter where possible
  for (const donation of pageResult.data) {
    // Validate donation admin user matches filter
    TestValidator.equals(
      "donation admin user id matches filter",
      donation.adminuser_id,
      filterRequest.adminuser_id,
    );
    // Validate donation member user id nullable vs filter (only if filter is set)
    if (
      filterRequest.memberuser_id !== null &&
      filterRequest.memberuser_id !== undefined
    ) {
      TestValidator.predicate(
        "donation member user id matches filter",
        donation.memberuser_id === filterRequest.memberuser_id,
      );
    }

    // Validate donation reason includes filter donation_reason substring
    if (
      filterRequest.donation_reason !== null &&
      filterRequest.donation_reason !== undefined
    ) {
      TestValidator.predicate(
        "donation reason includes filter substring",
        donation.donation_reason.includes(filterRequest.donation_reason),
      );
    }

    // Validate donation_date within filter range
    const donationDate = new Date(donation.donation_date);
    const startDate = filterRequest.donation_date_start
      ? new Date(filterRequest.donation_date_start)
      : null;
    const endDate = filterRequest.donation_date_end
      ? new Date(filterRequest.donation_date_end)
      : null;
    if (startDate !== null) {
      TestValidator.predicate(
        "donation date is after filter start",
        donationDate >= startDate,
      );
    }
    if (endDate !== null) {
      TestValidator.predicate(
        "donation date is before filter end",
        donationDate <= endDate,
      );
    }

    // Validate donation_amount is positive
    TestValidator.predicate(
      "donation amount is positive",
      donation.donation_amount > 0,
    );
  }
}
