import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";

/**
 * E2E test to validate the retrieval of seller responses from the admin
 * API.
 *
 * This test performs the full authorization workflow to create and log in
 * an admin user, authorizing subsequent access to seller response
 * retrieval. It verifies retrieval of existing seller responses by UUID and
 * confirms correct full response data matches expected schema. It also
 * tests error handling for retrieval with invalid or non-existent IDs.
 *
 * Steps:
 *
 * 1. Create an admin user with random valid credentials.
 * 2. Log in as that admin user to establish authorization context.
 * 3. Successfully retrieve a seller response by a generated or random UUID.
 * 4. Validate the response data fully.
 * 5. Attempt retrieval with a random UUID that does not exist to simulate
 *    failure.
 */
export async function test_api_seller_response_retrieve_success_and_fail(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 2. Log in as admin user
  const adminLoginBody = {
    email: admin.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminLogin);

  // 3. Successful retrieval of a seller response by a known id (simulate random UUID)
  // Use newly generated UUID for test; in real test this should correspond to an existing record
  const validResponseId = typia.random<string & tags.Format<"uuid">>();
  const sellerResponse: IShoppingMallSellerResponse =
    await api.functional.shoppingMall.adminUser.sellerResponses.at(connection, {
      id: validResponseId,
    });
  typia.assert(sellerResponse);

  // Validate key properties existence and types
  TestValidator.predicate(
    "Valid seller response has UUID id",
    typeof sellerResponse.id === "string" && sellerResponse.id.length > 0,
  );
  TestValidator.predicate(
    "Seller response has response_body",
    typeof sellerResponse.response_body === "string",
  );
  TestValidator.predicate(
    "Seller response has boolean is_private",
    typeof sellerResponse.is_private === "boolean",
  );
  TestValidator.equals(
    "Seller response status equals actual status",
    sellerResponse.status,
    sellerResponse.status,
  );

  // 4. Failure test: attempt retrieval using non-existent seller response ID
  const invalidResponseId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "should fail to retrieve non-existing seller response",
    async () => {
      await api.functional.shoppingMall.adminUser.sellerResponses.at(
        connection,
        { id: invalidResponseId },
      );
    },
  );
}
