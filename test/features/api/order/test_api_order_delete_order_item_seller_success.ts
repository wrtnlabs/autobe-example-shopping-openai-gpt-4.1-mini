import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates the deletion of an order item by a seller user.
 *
 * It covers the following steps:
 *
 * 1. Create and authenticate a seller user.
 * 2. Create and authenticate a member user.
 * 3. Seller creates a sale product.
 * 4. Member creates an order referencing the sale product.
 * 5. Seller adds an order item to the created order.
 * 6. Seller deletes the order item.
 *
 * Each step ensures type-safe API interaction with typia.assert validation.
 * Switches authentication context appropriately for member and seller
 * user.
 */
export async function test_api_order_delete_order_item_seller_success(
  connection: api.IConnection,
) {
  // 1. Seller user join
  const sellerCreateBody = {
    email: `seller${RandomGenerator.alphaNumeric(6)}@example.com`,
    password: "p4ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(8)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Member user join
  const memberCreateBody = {
    email: `member${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: "p4ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(memberUser);

  // 3. Seller login (re-authenticate to ensure correct context)
  const sellerLoginBody = {
    email: sellerCreateBody.email,
    password: sellerCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const sellerLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(sellerLogin);

  // 4. Seller creates a sale product
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: `code-${RandomGenerator.alphaNumeric(6)}`,
    status: "active",
    name: RandomGenerator.name(),
    description: "",
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 5. Member login / re-authenticate to ensure correct context
  const memberLoginBody = {
    email: memberCreateBody.email,
    password: "p4ssw0rd!",
  } satisfies IShoppingMallMemberUser.ILogin;

  const memberLogin: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLoginBody,
    });
  typia.assert(memberLogin);

  // 6. Member creates an order
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: sale.shopping_mall_channel_id,
    shopping_mall_section_id: null,
    order_code: `order-${RandomGenerator.alphaNumeric(6)}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // 7. Switch back to seller; seller login again to be sure
  await api.functional.auth.sellerUser.login(connection, {
    body: sellerLoginBody,
  });

  // 8. Seller adds an order item
  const orderItemCreateBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: sale.id,
    quantity: 1,
    price: 10000,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;

  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.sellerUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemCreateBody,
      },
    );
  typia.assert(orderItem);

  // 9. Seller deletes the order item
  await api.functional.shoppingMall.sellerUser.orders.items.erase(connection, {
    orderId: order.id,
    orderItemId: orderItem.id,
  });

  // No output to assert from deletion; success is no exception
}
