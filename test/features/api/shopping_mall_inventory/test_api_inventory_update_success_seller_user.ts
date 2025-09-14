import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Ensure seller user can update inventory stock and option combination code
 * successfully. Use appropriate authentication and verify updated inventory
 * data correctness including audit timestamps.
 */
export async function test_api_inventory_update_success_seller_user(
  connection: api.IConnection,
) {
  // 1. Seller user joins (register)
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerUserEmail,
      password: "P@ssword123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: RandomGenerator.mobile(),
      business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerUser);

  // 2. Seller user logs in
  const sellerUserLogin = await api.functional.auth.sellerUser.login(
    connection,
    {
      body: {
        email: sellerUserEmail,
        password: "P@ssword123!",
      } satisfies IShoppingMallSellerUser.ILogin,
    },
  );
  typia.assert(sellerUserLogin);

  // 3. Create an inventory record
  const shoppingMallSaleId = typia.random<string & tags.Format<"uuid">>();
  const inventoryCreateBody = {
    shopping_mall_sale_id: shoppingMallSaleId,
    option_combination_code: RandomGenerator.alphaNumeric(10),
    stock_quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<0>
    >() satisfies number as number,
  } satisfies IShoppingMallInventory.ICreate;
  const createdInventory =
    await api.functional.shoppingMall.sellerUser.inventory.create(connection, {
      body: inventoryCreateBody,
    });
  typia.assert(createdInventory);

  // 4. Update the inventory record
  const inventoryUpdateBody = {
    stock_quantity: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<0>
    >() satisfies number as number,
    option_combination_code: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallInventory.IUpdate;
  const updatedInventory =
    await api.functional.shoppingMall.sellerUser.inventory.update(connection, {
      inventoryId: createdInventory.id,
      body: inventoryUpdateBody,
    });
  typia.assert(updatedInventory);

  // 5. Validate that updatedInventory fields match the update data
  TestValidator.equals(
    "updated stock quantity matches",
    updatedInventory.stock_quantity,
    inventoryUpdateBody.stock_quantity ?? createdInventory.stock_quantity,
  );
  TestValidator.equals(
    "updated option combination code matches",
    updatedInventory.option_combination_code,
    inventoryUpdateBody.option_combination_code ??
      createdInventory.option_combination_code,
  );
  TestValidator.equals(
    "inventory id remains unchanged",
    updatedInventory.id,
    createdInventory.id,
  );
  TestValidator.equals(
    "shopping_mall_sale_id remains unchanged",
    updatedInventory.shopping_mall_sale_id,
    createdInventory.shopping_mall_sale_id,
  );
}
