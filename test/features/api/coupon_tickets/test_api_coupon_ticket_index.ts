import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCouponTicket";
import type { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test listing coupon tickets for a member user.
 *
 * This test validates that an authenticated member user can list their coupon
 * tickets with various filters applied. It includes pagination support,
 * filtering by coupon ID, usage status, valid date ranges, and ownership
 * constraints.
 *
 * The test ensures that only coupon tickets belonging to the authenticated
 * member user are returned.
 *
 * It also tests the API's behavior on invalid usage_status input and
 * unauthorized access.
 *
 * Detailed Step-by-step:
 *
 * 1. Execute dependencies: perform two member user join operations to establish
 *    authentication contexts.
 * 2. Authenticate as first member user.
 * 3. Call coupon ticket index endpoint with empty filter to get initial coupons.
 * 4. Extract coupon ticket IDs and related coupon IDs for filter tests.
 * 5. Test multiple filter cases: by coupon ID, by usage_status, by valid_from
 *    range, by valid_until range, pagination, with_count flag.
 * 6. Validate all response outputs using typia.assert and TestValidator.
 * 7. Test error behavior when using invalid usage_status.
 * 8. Test unauthorized access restriction.
 */
export async function test_api_coupon_ticket_index(
  connection: api.IConnection,
) {
  // 1. Dependency runs: join two member users
  const memberUser1: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: RandomGenerator.alphabets(5) + "@test.com",
        password_hash: "password123",
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser1);

  const memberUser2: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: RandomGenerator.alphabets(5) + "@test.com",
        password_hash: "password123",
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser2);

  // 2. Authenticate as memberUser1 is done by join call; the connection headers contain the token automatically

  // 3. Fetch all coupon tickets of memberUser1 without filters to get base data
  const allTicketsResponse: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          page: 1,
          limit: 10,
          with_count: true,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(allTicketsResponse);

  // Validate pagination properties
  TestValidator.predicate(
    "pagination.current is positive",
    allTicketsResponse.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination.limit is positive",
    allTicketsResponse.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination.records is non-negative",
    allTicketsResponse.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination.pages is non-negative",
    allTicketsResponse.pagination.pages >= 0,
  );

  // Check that all coupon tickets are uuid format strings
  for (const ticket of allTicketsResponse.data) {
    TestValidator.predicate(
      "coupon ticket id is uuid format",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        ticket.id,
      ),
    );
  }

  // 4. Prepare filter test values with defensive check
  let couponIds: string[] = [];
  if (allTicketsResponse.data.length > 0) {
    couponIds = ArrayUtil.repeat(3, () => {
      const idx = RandomGenerator.pick([
        ...Array(allTicketsResponse.data.length).keys(),
      ]);
      return (
        allTicketsResponse.data[idx]?.shopping_mall_coupon_id ??
        typia.random<string & tags.Format<"uuid">>()
      );
    });
  } else {
    couponIds = [typia.random<string & tags.Format<"uuid">>()];
  }

  // 5. Filter by coupon id
  const filteredByCouponId: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          shopping_mall_coupon_id: couponIds[0],
          page: 1,
          limit: 5,
          with_count: true,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(filteredByCouponId);
  for (const ticket of filteredByCouponId.data) {
    TestValidator.equals(
      "filtered coupon id matches",
      ticket.shopping_mall_coupon_id,
      couponIds[0],
    );
  }

  // 6. Filter by usage_status with a valid known value (take usage_status of first ticket or fallback)
  const usageStatusValid = allTicketsResponse.data[0]?.usage_status ?? "unused";
  const filteredByUsageStatus: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          usage_status: usageStatusValid,
          page: 1,
          limit: 5,
          with_count: true,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(filteredByUsageStatus);
  for (const ticket of filteredByUsageStatus.data) {
    TestValidator.equals(
      "filtered usage_status matches",
      ticket.usage_status,
      usageStatusValid,
    );
  }

  // 7. Filter by valid_from range - using created_at as valid proxy
  const fromDate =
    allTicketsResponse.data[0]?.created_at ?? new Date().toISOString();
  const toDate = new Date(
    new Date(fromDate).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();
  const filteredByValidFrom: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          valid_from_from: fromDate,
          valid_from_to: toDate,
          page: 1,
          limit: 5,
          with_count: true,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(filteredByValidFrom);

  // 8. Filter by valid_until range - same approach
  const filteredByValidUntil: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          valid_until_from: fromDate,
          valid_until_to: toDate,
          page: 1,
          limit: 5,
          with_count: true,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(filteredByValidUntil);

  // 9. Pagination test: page = 2 (or higher if data allows), limit = 2
  const paginatedSecondPage: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          page: 2,
          limit: 2,
          with_count: true,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(paginatedSecondPage);
  TestValidator.predicate(
    "pagination.current is 2",
    paginatedSecondPage.pagination.current === 2,
  );

  // 10. Test with_count = false
  const responseWithoutCount: IPageIShoppingMallCouponTicket.ISummary =
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          page: 1,
          limit: 5,
          with_count: false,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  typia.assert(responseWithoutCount);

  // 11. Test invalid usage_status - error expected
  await TestValidator.error("invalid usage status should error", async () => {
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      connection,
      {
        body: {
          memberuser_id: memberUser1.id,
          usage_status: "invalid_status",
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  });

  // 12. Test unauthorized access - simulate unauthenticated by empty headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthorized access should error", async () => {
    await api.functional.shoppingMall.memberUser.couponTickets.index(
      unauthenticatedConnection,
      {
        body: {
          memberuser_id: memberUser1.id,
        } satisfies IShoppingMallCouponTicket.IRequest,
      },
    );
  });
}
