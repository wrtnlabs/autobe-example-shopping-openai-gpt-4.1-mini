import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallMileage";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";

/**
 * Test searching and retrieving paginated mileage records for the
 * authenticated member user.
 *
 * This test covers the following:
 *
 * 1. Member user creation and authentication via the join API to acquire JWT
 *    token.
 * 2. Mileage records search with pagination and filtering, verifying correct
 *    and consistent data.
 * 3. Validation of the response structure and pagination details.
 * 4. Negative test case for unauthorized access.
 *
 * Steps:
 *
 * - Create a new member user with realistic test data.
 * - Use the authenticated connection to query mileage records.
 * - Test multiple pagination requests with different page and limit values.
 * - Validate that returned mileage data belong to the created member user.
 * - Check pagination metadata correctness.
 * - Attempt a mileage search with unauthorized connection and expect failure.
 */
export async function test_api_mileage_search_pagination_for_member(
  connection: api.IConnection,
) {
  // 1. Member user creation & authentication
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "enabled",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 2. Helper to perform mileage searches
  async function searchMileages(
    body: IShoppingMallMileage.IRequest,
  ): Promise<IPageIShoppingMallMileage> {
    const output: IPageIShoppingMallMileage =
      await api.functional.shoppingMall.memberUser.mileages.searchMileages(
        connection,
        { body },
      );
    typia.assert(output);
    return output;
  }

  // 3. Positive pagination test scenarios
  const pageableRequests: IShoppingMallMileage.IRequest[] = [
    {
      memberuser_id: member.id,
      page: 1,
      limit: 10,
    },
    {
      memberuser_id: member.id,
      page: 2,
      limit: 5,
    },
    {
      memberuser_id: member.id,
      page: 1,
      limit: 1,
    },
    {
      memberuser_id: member.id,
      page: 1,
      limit: 50,
    },
    {
      memberuser_id: member.id,
      mileage_balance_min: 0,
      mileage_balance_max: 1000000,
      page: 1,
      limit: 20,
    },
  ];

  for (const request of pageableRequests) {
    const result = await searchMileages(request);

    // Validate pagination info correctness
    const { pagination, data } = result;

    TestValidator.predicate(
      "pagination current page is matching request",
      pagination.current === (request.page ?? 1),
    );
    TestValidator.predicate(
      "pagination limit is matching request",
      pagination.limit === (request.limit ?? 10),
    );
    TestValidator.predicate(
      "pagination pages is correct",
      pagination.pages >= 1,
    );
    TestValidator.predicate(
      "pagination records is consistent",
      pagination.records >= data.length,
    );

    // Validate that all mileage records belong to the member user
    for (const mileage of data) {
      typia.assert(mileage);

      TestValidator.predicate(
        "mileage.memberuser_id matches member id or is null",
        mileage.memberuser_id === member.id ||
          mileage.memberuser_id === null ||
          mileage.memberuser_id === undefined,
      );

      TestValidator.predicate(
        "mileage.guestuser_id is null or undefined",
        mileage.guestuser_id === null || mileage.guestuser_id === undefined,
      );
    }
  }

  // 4. Negative test: Unauthorized access should fail
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "unauthorized mileage search should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.mileages.searchMileages(
        unauthConn,
        {
          body: {
            memberuser_id: member.id,
            page: 1,
            limit: 10,
          } satisfies IShoppingMallMileage.IRequest,
        },
      );
    },
  );
}
