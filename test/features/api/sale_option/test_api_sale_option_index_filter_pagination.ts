import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOption";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sale_option_index_filter_pagination(
  connection: api.IConnection,
) {
  // 1. Seller user joins and authenticates
  const sellerUserCreateBody: IShoppingMallSellerUser.ICreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123",
    nickname: RandomGenerator.name(),
    full_name: `${RandomGenerator.name(1)} ${RandomGenerator.name(1)}`,
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  };
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Prepare a sale option filter body for index API
  // Use a keyword search for better reliability, generate random partial string
  const searchKeyword = RandomGenerator.alphaNumeric(3);
  const pageNumber = 1;
  const limitCount = 5;
  const orderByString = "created_at DESC";

  const filterBody: IShoppingMallSaleOption.IRequest = {
    search: searchKeyword,
    page: pageNumber,
    limit: limitCount,
    orderBy: orderByString,
  };

  // 3. Call the saleOptions.index API
  const pageResult: IPageIShoppingMallSaleOption.ISummary =
    await api.functional.shoppingMall.sellerUser.saleOptions.index(connection, {
      body: filterBody,
    });
  typia.assert(pageResult);

  // 4. Validate response structure
  const pagination = pageResult.pagination;
  const dataList = pageResult.data;

  TestValidator.predicate(
    "pagination current page is correct",
    pagination.current === pageNumber,
  );
  TestValidator.predicate(
    "pagination limit is correct",
    pagination.limit === limitCount,
  );
  TestValidator.predicate(
    "pagination pages is positive or zero",
    pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records is positive or zero",
    pagination.records >= 0,
  );

  TestValidator.predicate(
    "data list length does not exceed limit",
    dataList.length <= limitCount,
  );

  // All data items are IShoppingMallSaleOption.ISummary
  for (const option of dataList) {
    typia.assert(option);
    TestValidator.predicate(
      "option id is uuid format",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        option.id,
      ),
    );
    TestValidator.predicate(
      "option group id is uuid format",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        option.shopping_mall_sale_option_group_id,
      ),
    );
    TestValidator.predicate("option code is non-empty", option.code.length > 0);
    TestValidator.predicate("option name is non-empty", option.name.length > 0);
    TestValidator.predicate("option type is non-empty", option.type.length > 0);
    TestValidator.predicate(
      "created_at matches ISO 8601",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(option.created_at),
    );
    TestValidator.predicate(
      "updated_at matches ISO 8601",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(option.updated_at),
    );

    // Additional check: The option code or name contains the searchKeyword (case insensitive)
    const keywordLower = searchKeyword.toLowerCase();
    TestValidator.predicate(
      `option code or name contains searchKeyword ${searchKeyword}`,
      option.code.toLowerCase().includes(keywordLower) ||
        option.name.toLowerCase().includes(keywordLower),
    );
  }
}
