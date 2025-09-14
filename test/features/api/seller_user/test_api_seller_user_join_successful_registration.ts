import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_seller_user_join_successful_registration(
  connection: api.IConnection,
) {
  // Step 1: Prepare valid registration input data with all required props from IShoppingMallSellerUser.ICreate
  const email = typia.random<string & tags.Format<"email">>();
  const password = "P@ssword123!";
  const nickname = RandomGenerator.name();
  const full_name = RandomGenerator.name(2);
  const phone_number: string | null = null; // Optional nullable, explicit null
  const business_registration_number = `BRN${typia.random<number & tags.Type<"uint32"> & tags.Minimum<10000000> & tags.Maximum<99999999>>()}`;

  const requestBody = {
    email,
    password,
    nickname,
    full_name,
    phone_number,
    business_registration_number,
  } satisfies IShoppingMallSellerUser.ICreate;

  // Step 2: Call API
  const response: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: requestBody,
    });

  // Step 3: Assert response structure using typia
  typia.assert(response);

  // Step 4: Business logic validation using TestValidator
  TestValidator.equals("email matches", response.email, email);
  TestValidator.equals("nickname matches", response.nickname, nickname);
  TestValidator.equals("full_name matches", response.full_name, full_name);
  TestValidator.equals(
    "business_registration_number matches",
    response.business_registration_number,
    business_registration_number,
  );

  TestValidator.predicate(
    "id is valid UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      response.id,
    ),
  );
  TestValidator.predicate(
    "created_at is ISO datetime",
    !isNaN(Date.parse(response.created_at)),
  );
  TestValidator.predicate(
    "updated_at is ISO datetime",
    !isNaN(Date.parse(response.updated_at)),
  );

  TestValidator.predicate(
    "password_hash is not empty",
    typeof response.password_hash === "string" &&
      response.password_hash.length > 0,
  );
  TestValidator.predicate(
    "password_hash differs from plain password",
    response.password_hash !== password,
  );

  TestValidator.equals(
    "phone_number matches or null",
    response.phone_number ?? null,
    phone_number,
  );
  TestValidator.predicate(
    "status is non-empty string",
    typeof response.status === "string" && response.status.length > 0,
  );

  TestValidator.predicate(
    "token.access is non-empty string",
    typeof response.token.access === "string" &&
      response.token.access.length > 0,
  );
  TestValidator.predicate(
    "token.refresh is non-empty string",
    typeof response.token.refresh === "string" &&
      response.token.refresh.length > 0,
  );
  TestValidator.predicate(
    "token.expired_at is ISO datetime",
    !isNaN(Date.parse(response.token.expired_at)),
  );
  TestValidator.predicate(
    "token.refreshable_until is ISO datetime",
    !isNaN(Date.parse(response.token.refreshable_until)),
  );

  if (response.accessToken !== undefined) {
    TestValidator.predicate(
      "accessToken is non-empty if present",
      response.accessToken.length > 0,
    );
  }
  if (response.refreshToken !== undefined) {
    TestValidator.predicate(
      "refreshToken is non-empty if present",
      response.refreshToken.length > 0,
    );
  }
}
