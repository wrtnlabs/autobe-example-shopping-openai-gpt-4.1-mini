import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_memberuser_login_success_and_failure_cases(
  connection: api.IConnection,
) {
  // 1. Register new member user
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "P@ssword1234", // Plain text password for creation
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: createBody,
    });
  typia.assert(memberUser);

  // 2. Login with correct email and password
  const loginBody = {
    email: createBody.email,
    password: createBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;
  const authorized: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: loginBody,
    });
  typia.assert(authorized);

  TestValidator.equals(
    "login user email matches registration email",
    authorized.email,
    createBody.email,
  );
  TestValidator.equals(
    "login user id equals registration user id",
    authorized.id,
    memberUser.id,
  );
  TestValidator.predicate(
    "authorization token access is non-empty string",
    authorized.token.access.length > 0,
  );
  TestValidator.predicate(
    "authorization token refresh is non-empty string",
    authorized.token.refresh.length > 0,
  );
  TestValidator.predicate(
    "authorization token expired_at is valid ISO date",
    !isNaN(Date.parse(authorized.token.expired_at)),
  );
  TestValidator.predicate(
    "authorization token refreshable_until is valid ISO date",
    !isNaN(Date.parse(authorized.token.refreshable_until)),
  );
  TestValidator.predicate(
    "login does not expose plaintext password",
    !(authorized as unknown as Record<string, string>)["password"],
  );

  // 3. Login failure with wrong password
  await TestValidator.error(
    "login should fail with wrong password",
    async () => {
      await api.functional.auth.memberUser.login(connection, {
        body: {
          email: createBody.email,
          password: "WrongPassword!",
        } satisfies IShoppingMallMemberUser.ILogin,
      });
    },
  );

  // 4. Login failure with non-existent email
  await TestValidator.error(
    "login should fail with non-existent email",
    async () => {
      await api.functional.auth.memberUser.login(connection, {
        body: {
          email: typia.random<string & tags.Format<"email">>(),
          password: "AnyPassword123!",
        } satisfies IShoppingMallMemberUser.ILogin,
      });
    },
  );
}
