import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_inventory_creation_unauthorized(
  connection: api.IConnection,
) {
  // 1. Perform seller user join required for business context
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: typia.random<string & tags.Format<"email">>(),
      password: "P@ssword123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: null,
      business_registration_number: RandomGenerator.alphaNumeric(10),
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerUser);

  // 2. Prepare inventory creation data payload
  const payload = {
    shopping_mall_sale_id: typia.random<string & tags.Format<"uuid">>(),
    option_combination_code: RandomGenerator.alphaNumeric(8),
    stock_quantity: 50,
  } satisfies IShoppingMallInventory.ICreate;

  // 3. Create a fresh connection with empty headers to simulate unauthorized access
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 4. Execute the create call and expect an authorization error
  await TestValidator.error(
    "Unauthorized inventory creation should be rejected",
    async () => {
      await api.functional.shoppingMall.sellerUser.inventory.create(
        unauthorizedConnection,
        {
          body: payload,
        },
      );
    },
  );
}
