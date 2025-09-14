import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates an administrator user successfully retrieving
 * detailed seller user information. It covers the complete flow: admin user
 * creation, admin login, seller user creation, and subsequent seller user
 * detail fetching by the admin.
 *
 * The test ensures all required fields are provided with realistic values,
 * adheres to format constraints, and verifies that the seller user data fetched
 * matches the created seller's properties exactly.
 *
 * This scenario represents a typical admin user workflow viewing seller
 * profiles securely.
 */
export async function test_api_seller_seller_user_fetch_detail_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins using valid admin user creation data.
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

  // 2. Admin user login to switch authentication context.
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: adminUser.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Seller user joins with valid seller info including optional phone_number.
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: `${RandomGenerator.alphaNumeric(3).toUpperCase()}${RandomGenerator.alphaNumeric(6)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 4. Admin fetches detailed seller user data by seller's ID.
  const fetchedSeller: IShoppingMallSellerUser =
    await api.functional.shoppingMall.adminUser.sellerUsers.at(connection, {
      id: sellerUser.id,
    });
  typia.assert(fetchedSeller);

  // 5. Validate fetched seller data matches created seller's properties.
  TestValidator.equals(
    "seller id should match",
    fetchedSeller.id,
    sellerUser.id,
  );
  TestValidator.equals(
    "seller email should match",
    fetchedSeller.email,
    sellerUser.email,
  );
  TestValidator.equals(
    "seller password_hash should match",
    fetchedSeller.password_hash,
    sellerUser.password_hash,
  );
  TestValidator.equals(
    "seller nickname should match",
    fetchedSeller.nickname,
    sellerUser.nickname,
  );
  TestValidator.equals(
    "seller full_name should match",
    fetchedSeller.full_name,
    sellerUser.full_name,
  );
  TestValidator.equals(
    "seller phone_number should match",
    fetchedSeller.phone_number,
    sellerUser.phone_number,
  );
  TestValidator.equals(
    "seller status should match",
    fetchedSeller.status,
    sellerUser.status,
  );
  TestValidator.equals(
    "seller business_registration_number should match",
    fetchedSeller.business_registration_number,
    sellerUser.business_registration_number,
  );
  TestValidator.equals(
    "seller created_at should match",
    fetchedSeller.created_at,
    sellerUser.created_at,
  );
  TestValidator.equals(
    "seller updated_at should match",
    fetchedSeller.updated_at,
    sellerUser.updated_at,
  );
  TestValidator.equals(
    "seller deleted_at should match",
    fetchedSeller.deleted_at ?? null,
    sellerUser.deleted_at ?? null,
  );
}
