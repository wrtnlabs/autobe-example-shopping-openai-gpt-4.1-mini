import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_inventory_creation_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins and authenticates
  const sellerJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(6).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerJoinBody,
    });
  typia.assert(seller);

  // 2. Create a sale product with sellerUser authorization
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: seller.id,
    code: `SALE-${RandomGenerator.alphaNumeric(8).toUpperCase()}`,
    status: "active",
    name: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    description: RandomGenerator.content({ paragraphs: 2 }),
    price: Math.round(10000 + Math.random() * 90000),
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);
  TestValidator.equals(
    "sale seller user id matches",
    sale.shopping_mall_seller_user_id,
    seller.id,
  );

  // 3. Create inventory record for the created sale
  const optionCode = `OPT-${RandomGenerator.alphaNumeric(5).toUpperCase()}`;
  const stockQty = Math.floor(10 + Math.random() * 90);
  const inventoryCreateBody = {
    shopping_mall_sale_id: sale.id,
    option_combination_code: optionCode,
    stock_quantity: stockQty,
  } satisfies IShoppingMallInventory.ICreate;

  const inventory: IShoppingMallInventory =
    await api.functional.shoppingMall.sellerUser.inventory.create(connection, {
      body: inventoryCreateBody,
    });
  typia.assert(inventory);

  TestValidator.equals(
    "inventory sale id matches",
    inventory.shopping_mall_sale_id,
    sale.id,
  );
  TestValidator.equals(
    "inventory option code matches",
    inventory.option_combination_code,
    optionCode,
  );
  TestValidator.equals(
    "inventory stock quantity matches",
    inventory.stock_quantity,
    stockQty,
  );
  TestValidator.predicate(
    "inventory has creation timestamp",
    typeof inventory.created_at === "string" && inventory.created_at.length > 0,
  );
  TestValidator.predicate(
    "inventory has update timestamp",
    typeof inventory.updated_at === "string" && inventory.updated_at.length > 0,
  );
}
