import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallGuestUsers";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUsers";

export async function test_api_guest_user_list_admin_user_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Prepare filtering and pagination request
  const guestUserRequest: IShoppingMallGuestUsers.IRequest = {
    page: 1,
    limit: 5,
    sortBy: "session_start_at",
    sortDirection: "desc",
    search: RandomGenerator.substring("guest user search"),
    session_start_after: new Date(Date.now() - 7 * 86400000).toISOString(),
    session_start_before: new Date().toISOString(),
    status: "active",
  };

  // 3. Call guest user listing API with admin authentication
  const guestList: IPageIShoppingMallGuestUsers.ISummary =
    await api.functional.shoppingMall.adminUser.guestUsers.index(connection, {
      body: guestUserRequest,
    });
  typia.assert(guestList);

  // 4. Validate pagination info
  TestValidator.predicate(
    "pagination current is positive integer",
    Number.isInteger(guestList.pagination.current) &&
      guestList.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit is positive integer",
    Number.isInteger(guestList.pagination.limit) &&
      guestList.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination records is non-negative integer",
    Number.isInteger(guestList.pagination.records) &&
      guestList.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages is positive integer",
    Number.isInteger(guestList.pagination.pages) &&
      guestList.pagination.pages > 0,
  );

  // 5. Validate guest user data array
  TestValidator.predicate(
    "guest user data array is an array",
    Array.isArray(guestList.data),
  );

  if (guestList.data.length > 0) {
    // Validate first guest item
    const firstGuest = guestList.data[0];
    typia.assert(firstGuest);
    TestValidator.predicate(
      "guest id is valid UUID",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        firstGuest.id,
      ),
    );
    TestValidator.predicate(
      "ip_address is non-empty string",
      typeof firstGuest.ip_address === "string" &&
        firstGuest.ip_address.length > 0,
    );
    TestValidator.predicate(
      "access_url is non-empty string",
      typeof firstGuest.access_url === "string" &&
        firstGuest.access_url.length > 0,
    );
    TestValidator.predicate(
      "session_start_at is ISO string",
      !isNaN(Date.parse(firstGuest.session_start_at)),
    );
  }

  // 6. Test unauthorized access (without authentication)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized access should fail", async () => {
    await api.functional.shoppingMall.adminUser.guestUsers.index(
      unauthenticatedConnection,
      { body: guestUserRequest },
    );
  });

  // 7. Test invalid filter parameters to trigger validation errors
  await TestValidator.error("invalid negative page should fail", async () => {
    await api.functional.shoppingMall.adminUser.guestUsers.index(connection, {
      body: {
        ...guestUserRequest,
        page: -1,
      },
    });
  });

  await TestValidator.error("invalid sortDirection should fail", async () => {
    await api.functional.shoppingMall.adminUser.guestUsers.index(connection, {
      body: {
        ...guestUserRequest,
        sortDirection: "invalid" as "asc" | "desc" | null | undefined,
      },
    });
  });
}
