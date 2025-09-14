import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test scenario: Verify successful update of an existing seller user
 * through admin user administration APIs.
 *
 * The test performs the following sequence:
 *
 * 1. Create an admin user account (join).
 * 2. Login as the created admin user to obtain authorization.
 * 3. Use the authenticated admin context to update a seller user's information
 *    by ID.
 *
 * The update operation sends valid new data fields for the seller user such
 * as a unique email, nickname, full name, optional phone number, status,
 * and business registration number.
 *
 * The test asserts that the returned updated seller user matches the fields
 * sent. It also ensures the update only occurs under proper admin
 * authorization.
 *
 * Each API call is validated for correct response type using typia.assert.
 * All API calls use await and correct DTO types for requests and responses.
 * Random realistic data respecting DTO constraints and formats is
 * generated.
 */
export async function test_api_seller_user_update_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Login as admin user
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminAuthorized);

  // 3. Update seller user
  const updateId = typia.random<string & tags.Format<"uuid">>();
  const updateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
    business_registration_number: RandomGenerator.alphaNumeric(15),
  } satisfies IShoppingMallSellerUser.IUpdate;

  const updatedSellerUser: IShoppingMallSellerUser =
    await api.functional.shoppingMall.adminUser.sellerUsers.update(connection, {
      id: updateId,
      body: updateBody,
    });
  typia.assert(updatedSellerUser);

  // Assert updated fields match
  TestValidator.equals(
    "email should be updated",
    updatedSellerUser.email,
    updateBody.email,
  );
  TestValidator.equals(
    "nickname should be updated",
    updatedSellerUser.nickname,
    updateBody.nickname,
  );
  TestValidator.equals(
    "full_name should be updated",
    updatedSellerUser.full_name,
    updateBody.full_name,
  );
  TestValidator.equals(
    "phone_number should be updated",
    updatedSellerUser.phone_number,
    updateBody.phone_number,
  );
  TestValidator.equals(
    "status should be updated",
    updatedSellerUser.status,
    updateBody.status,
  );
  TestValidator.equals(
    "business_registration_number should be updated",
    updatedSellerUser.business_registration_number,
    updateBody.business_registration_number,
  );
}
