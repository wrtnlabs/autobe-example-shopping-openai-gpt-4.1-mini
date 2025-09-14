import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDepositCharge";
import type { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_deposit_charge_search_filtered_paginated_member_user(
  connection: api.IConnection,
) {
  // Step 1: Create a new member user
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // Step 2: Login the created member user
  const loginBody = {
    email: memberUserCreateBody.email,
    password: memberUserCreateBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;
  const loggedInUser = await api.functional.auth.memberUser.login(connection, {
    body: loginBody,
  });
  typia.assert(loggedInUser);

  // Step 3: Perform deposit charge searches with various filters

  // Base criteria for filtering linked with authenticated memberuser_id
  const baseFilter: IShoppingMallDepositCharge.IRequest = {
    memberuser_id: memberUser.id,
    page: 1,
    limit: 10,
  };

  // Test 1: Empty filter (only with memberuser_id)
  let searchResult =
    await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
      connection,
      { body: baseFilter },
    );
  typia.assert(searchResult);

  TestValidator.predicate(
    "deposit charges data contains only the member user's charges",
    searchResult.data.every((charge) => charge.memberuser_id === memberUser.id),
  );

  // Test 2: Filter by single charge status if any in results
  if (searchResult.data.length > 0) {
    const statusToTest = searchResult.data[0].charge_status;
    const requestBody = {
      ...baseFilter,
      charge_status: statusToTest,
    } satisfies IShoppingMallDepositCharge.IRequest;
    const resultByStatus =
      await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
        connection,
        { body: requestBody },
      );
    typia.assert(resultByStatus);
    TestValidator.predicate(
      "filtered result charge_status matches",
      resultByStatus.data.every(
        (charge) => charge.charge_status === statusToTest,
      ),
    );
  }

  // Test 3: Filter by payment_provider if any in results
  if (searchResult.data.length > 0) {
    const providerToTest = searchResult.data[0].payment_provider;
    const requestBody = {
      ...baseFilter,
      payment_provider: providerToTest,
    } satisfies IShoppingMallDepositCharge.IRequest;
    const resultByProvider =
      await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
        connection,
        { body: requestBody },
      );
    typia.assert(resultByProvider);
    TestValidator.predicate(
      "filtered result payment_provider matches",
      resultByProvider.data.every(
        (charge) => charge.payment_provider === providerToTest,
      ),
    );
  }

  // Test 4: Filter by paid_at date single value
  if (searchResult.data.length > 0) {
    const dates = searchResult.data
      .map((charge) => charge.paid_at)
      .filter((date): date is string => date !== null && date !== undefined)
      .sort();
    if (dates.length >= 1) {
      const dateToTest = dates[0];
      const requestBody = {
        ...baseFilter,
        paid_at: dateToTest,
      } satisfies IShoppingMallDepositCharge.IRequest;
      const singleDayResult =
        await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
          connection,
          { body: requestBody },
        );
      typia.assert(singleDayResult);

      TestValidator.predicate(
        "single day paid_at filter matches",
        singleDayResult.data.every(
          (charge) =>
            charge.paid_at === dateToTest ||
            charge.paid_at === null ||
            charge.paid_at === undefined,
        ),
      );
    }
  }

  // Test 5: Pagination test, request page 2
  const pagedRequest = {
    ...baseFilter,
    page: 2,
    limit: 5,
  } satisfies IShoppingMallDepositCharge.IRequest;
  const page2Result =
    await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
      connection,
      { body: pagedRequest },
    );
  typia.assert(page2Result);
  TestValidator.predicate(
    "page 2 result page property matches",
    page2Result.pagination.current === 2,
  );
  TestValidator.predicate(
    "page 2 result limit matches",
    page2Result.pagination.limit === 5,
  );

  // Test 6: Invalid filter test - search with charge_status unlikely to exist
  const invalidFilter = {
    ...baseFilter,
    charge_status: "non-existent-status",
  } satisfies IShoppingMallDepositCharge.IRequest;
  const invalidResult =
    await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
      connection,
      { body: invalidFilter },
    );
  typia.assert(invalidResult);
  TestValidator.equals(
    "invalid filter returns empty data",
    invalidResult.data.length,
    0,
  );

  // Test 7: Test error when not authenticated (simulate by clearing headers)
  const unauthenticatedConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized search throws error", async () => {
    await api.functional.shoppingMall.memberUser.depositCharges.searchDepositCharges(
      unauthenticatedConn,
      { body: baseFilter },
    );
  });
}
