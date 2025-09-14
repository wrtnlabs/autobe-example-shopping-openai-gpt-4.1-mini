import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate sale option creation success and duplicate code rejection.
 *
 * This test performs seller user registration and authentication, creates a
 * sale option with unique code, then attempts to create a second sale
 * option using the same code to verify that duplicate code creation is
 * rejected by the API.
 *
 * Steps:
 *
 * 1. Register a seller user and assert successful authorization.
 * 2. Create a sale option with valid and unique code and assert the response.
 * 3. Try creating another sale option with the same code and expect an error.
 *
 * This ensures the correctness of sale option creation business logic,
 * uniqueness constraints, and authorization handling.
 *
 * All UUIDs and data are generated with typia.random and RandomGenerator
 * for realism.
 *
 * Await and type assert every API call's result.
 *
 * TestValidator is used with descriptive titles.
 */
export async function test_api_sale_option_create_success_and_duplicate_code(
  connection: api.IConnection,
) {
  // 1. Seller user registration and authentication
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUserFullName: string = RandomGenerator.name();
  const sellerUserNickname: string = RandomGenerator.name();
  const sellerUserBusinessNumber: string = RandomGenerator.alphaNumeric(12);

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: "Password123!",
        nickname: sellerUserNickname,
        full_name: sellerUserFullName,
        phone_number: null,
        business_registration_number: sellerUserBusinessNumber,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Create a sale option with unique code
  const saleOptionGroupId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const uniqueSaleOptionCode = `code_${RandomGenerator.alphaNumeric(8)}`;
  const saleOptionName = RandomGenerator.name();
  const saleOptionType = "selection"; // assumed generic valid type

  const saleOption1: IShoppingMallSaleOption =
    await api.functional.shoppingMall.sellerUser.saleOptions.create(
      connection,
      {
        body: {
          shopping_mall_sale_option_group_id: saleOptionGroupId,
          code: uniqueSaleOptionCode,
          name: saleOptionName,
          type: saleOptionType,
        } satisfies IShoppingMallSaleOption.ICreate,
      },
    );
  typia.assert(saleOption1);

  TestValidator.equals(
    "created sale option's shopping_mall_sale_option_group_id matches",
    saleOption1.shopping_mall_sale_option_group_id,
    saleOptionGroupId,
  );
  TestValidator.equals(
    "created sale option's code matches",
    saleOption1.code,
    uniqueSaleOptionCode,
  );
  TestValidator.equals(
    "created sale option's name matches",
    saleOption1.name,
    saleOptionName,
  );
  TestValidator.equals(
    "created sale option's type matches",
    saleOption1.type,
    saleOptionType,
  );

  // 3. Attempt to create another sale option with the same code and expect an error
  await TestValidator.error(
    "creating sale option with duplicate code should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptions.create(
        connection,
        {
          body: {
            shopping_mall_sale_option_group_id: typia.random<
              string & tags.Format<"uuid">
            >(), // different group id
            code: uniqueSaleOptionCode, // duplicate code
            name: RandomGenerator.name(),
            type: saleOptionType,
          } satisfies IShoppingMallSaleOption.ICreate,
        },
      );
    },
  );
}
