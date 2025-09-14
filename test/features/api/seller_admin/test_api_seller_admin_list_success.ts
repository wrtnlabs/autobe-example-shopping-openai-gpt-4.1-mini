import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerUser";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates administrative seller listing with filters and
 * pagination.
 *
 * The test creates an admin user, several seller users with varying statuses,
 * then uses the admin API endpoint to list seller users filtered by status and
 * search text with pagination.
 *
 * It ensures the returned data respects the pagination metadata and filtering
 * criteria, and validates the structure and content of sellers returned.
 */
export async function test_api_seller_admin_list_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "ValidPass123!";
  const adminCreateBody = {
    email: adminEmail,
    password_hash: adminPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create multiple seller users
  const sellerCount = 5;

  // Predefined statuses to cover filtering
  const possibleStatuses = ["active", "pending", "suspended"] as const;

  // Creating sellers with distinct and controlled email and status to test search and filtering
  const sellers: IShoppingMallSellerUser.IAuthorized[] = [];

  for (let i = 0; i < sellerCount; ++i) {
    const status = possibleStatuses[i % possibleStatuses.length];
    const email = `seller${i + 1}@example.com`;
    const password = `SellerPass${i + 1}!`;

    const sellerCreateBody = {
      email,
      password,
      nickname: `SellerNick${i + 1}`,
      full_name: `Seller FullName ${i + 1}`,
      phone_number: i % 2 === 0 ? RandomGenerator.mobile() : null,
      business_registration_number: `BRN${100000000 + i}`,
    } satisfies IShoppingMallSellerUser.ICreate;

    const sellerUser = await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
    typia.assert(sellerUser);
    sellers.push(sellerUser);
  }

  // 3. Perform the seller user listing with filters and pagination
  // We'll filter by status "active" and search substring "SellerNick"
  const filterStatus = "active";
  const searchText = "Nick";
  const page = 1;
  const limit = 3;

  const listRequestBody = {
    page,
    limit,
    status: filterStatus,
    search: searchText,
    sort: null,
  } satisfies IShoppingMallSellerUser.IRequest;

  const sellerList: IPageIShoppingMallSellerUser.ISummary =
    await api.functional.shoppingMall.adminUser.sellerUsers.index(connection, {
      body: listRequestBody,
    });

  typia.assert(sellerList);

  // 4. Validate pagination info
  TestValidator.predicate(
    "pagination current page is correct",
    sellerList.pagination.current === page,
  );
  TestValidator.predicate(
    "pagination limit is correct",
    sellerList.pagination.limit === limit,
  );
  TestValidator.predicate(
    "pagination records do not exceed total",
    sellerList.pagination.records >= sellerList.data.length,
  );
  TestValidator.predicate(
    "pagination pages is >= current page",
    sellerList.pagination.pages >= page,
  );

  // 5. Validate each seller matches filter criteria
  for (const seller of sellerList.data) {
    typia.assert(seller);

    // Verify status matching
    TestValidator.equals(
      "seller status matches filter",
      seller.status,
      filterStatus,
    );

    // Verify search matches at least email, nickname, or full_name contain searchText ignoring case
    const lowerSearch = searchText.toLowerCase();
    const matched = [seller.email, seller.nickname, seller.full_name].some(
      (text) => text.toLowerCase().includes(lowerSearch),
    );
    TestValidator.predicate(
      `seller matches search text '${searchText}'`,
      matched,
    );
  }

  // 6. Validate seller IDs are unique in the returned page
  const ids = sellerList.data.map((s) => s.id);
  const uniqueIds = new Set(ids);
  TestValidator.equals("unique seller IDs in page", uniqueIds.size, ids.length);
}
