import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItemOption";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";

/**
 * Test retrieving a paginated list of cart item options for a specific cart
 * item by cartItemId with adminUser authentication. This test validates the
 * full workflow of adminUser joining the system to obtain authentication and
 * then querying the cart item options. It includes successful listing with
 * valid cartItemId and filtering parameters, paginated responses, and error
 * cases such as invalid cartItemId and unauthorized access. The test performs
 * role-based authentication and ensures data consistency, filtering, and
 * pagination behavior.
 */
export async function test_api_cart_list_cart_item_options_success_and_error_cases(
  connection: api.IConnection,
) {
  // 1. Admin user joins and authenticates
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate a sample cartItemId uuid to use in listing
  const cartItemId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Basic list call with empty filters returns paginated result
  const baseRequestBody = {} satisfies IShoppingMallCartItemOption.IRequest;
  const baseListResult: IPageIShoppingMallCartItemOption =
    await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
      connection,
      {
        cartItemId,
        body: baseRequestBody,
      },
    );
  typia.assert(baseListResult);

  // Validate pagination info exists
  TestValidator.predicate(
    "pagination pages >= 0",
    baseListResult.pagination.pages >= 0,
  );

  // 4. If data returned (not empty), validate each option's cart item id matches
  if (baseListResult.data.length > 0) {
    for (const option of baseListResult.data) {
      typia.assert<IShoppingMallCartItemOption>(option);
      TestValidator.equals(
        "cart item id in result should match requested cartItemId",
        option.shopping_cart_item_id,
        cartItemId,
      );
    }
  }

  // 5. Filtering by shopping_sale_option_group_id if data exists
  if (baseListResult.data.length > 0) {
    const optionGroupIds = baseListResult.data.map(
      (opt) => opt.shopping_sale_option_group_id,
    );
    if (optionGroupIds.length > 0) {
      const filterGroupId = RandomGenerator.pick(optionGroupIds);
      const filterRequestBody = {
        shopping_sale_option_group_id: filterGroupId,
      } satisfies IShoppingMallCartItemOption.IRequest;

      const filteredListResult =
        await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
          connection,
          {
            cartItemId,
            body: filterRequestBody,
          },
        );
      typia.assert(filteredListResult);

      // All returned options match the filter
      filteredListResult.data.forEach((item) => {
        typia.assert<IShoppingMallCartItemOption>(item);
        TestValidator.equals(
          "option's group id matches filter",
          item.shopping_sale_option_group_id,
          filterGroupId,
        );
      });
    }
  }

  // 6. Filtering by shopping_sale_option_id if data exists
  if (baseListResult.data.length > 0) {
    const optionIds = baseListResult.data.map(
      (opt) => opt.shopping_sale_option_id,
    );
    if (optionIds.length > 0) {
      const filterOptionId = RandomGenerator.pick(optionIds);
      const filterReqBody = {
        shopping_sale_option_id: filterOptionId,
      } satisfies IShoppingMallCartItemOption.IRequest;

      const filterResult =
        await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
          connection,
          { cartItemId, body: filterReqBody },
        );
      typia.assert(filterResult);
      filterResult.data.forEach((opt) => {
        typia.assert<IShoppingMallCartItemOption>(opt);
        TestValidator.equals(
          "option id matches filter",
          opt.shopping_sale_option_id,
          filterOptionId,
        );
      });
    }
  }

  // 7. Filtering by created_at and updated_at timestamps if data exists
  if (baseListResult.data.length > 0) {
    for (const dateField of ["created_at", "updated_at"] as const) {
      const timestamps = baseListResult.data
        .map((opt) => opt[dateField])
        .filter((ts) => ts !== null && ts !== undefined);
      if (timestamps.length > 0) {
        const filterTimestamp = RandomGenerator.pick(timestamps);
        const filterBody = {
          [dateField]: filterTimestamp,
        } satisfies IShoppingMallCartItemOption.IRequest;

        const filteredByDateResult =
          await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
            connection,
            {
              cartItemId,
              body: filterBody,
            },
          );
        typia.assert(filteredByDateResult);
        filteredByDateResult.data.forEach((item) => {
          typia.assert<IShoppingMallCartItemOption>(item);
          TestValidator.equals(
            `verify filter by ${dateField}`,
            item[dateField],
            filterTimestamp,
          );
        });
      }
    }
  }

  // 8. Error scenario - Invalid cartItemId (empty string) should throw error
  await TestValidator.error(
    "invalid cartItemId empty string throws",
    async () => {
      await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
        connection,
        {
          cartItemId: "" as unknown as string & tags.Format<"uuid">,
          body: {} satisfies IShoppingMallCartItemOption.IRequest,
        },
      );
    },
  );

  // 9. Error scenario - Invalid cartItemId malformed uuid throws error
  await TestValidator.error(
    "invalid cartItemId malformed uuid throws",
    async () => {
      await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
        connection,
        {
          cartItemId: "123-invalid-uuid" as unknown as string &
            tags.Format<"uuid">,
          body: {} satisfies IShoppingMallCartItemOption.IRequest,
        },
      );
    },
  );

  // 10. Error scenario - Unauthorized access (simulate by empty token)
  // Clear headers to simulate no authorization
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized access throws", async () => {
    await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.index(
      unauthConn,
      {
        cartItemId,
        body: {} satisfies IShoppingMallCartItemOption.IRequest,
      },
    );
  });
}
