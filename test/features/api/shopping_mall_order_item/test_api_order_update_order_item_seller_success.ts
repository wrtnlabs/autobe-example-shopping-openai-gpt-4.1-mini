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
 * This E2E test validates the successful update of a specific order item by an
 * authenticated seller user within the shopping mall platform. The test spans a
 * full business workflow involving multiple user roles and entities:
 *
 * 1. Seller user is registered and logged in, establishing seller context.
 * 2. A product sale is created under the seller’s account.
 * 3. A member user is registered and logged in.
 * 4. The member user places a new order referencing the seller’s product sale.
 * 5. The seller adds an order item to this order, associating the sale snapshot.
 * 6. The main test action: The seller updates the order item’s quantity, price,
 *    and status with valid data.
 *
 * All API responses are verified with typia.assert to ensure type correctness.
 * Business logic validations assert that updated values properly reflect in the
 * returned order item. Authentication context switches are managed to simulate
 * real-world multi-user interaction scenarios.
 *
 * This test ensures critical seller abilities for managing order items reliably
 * and securely.
 */
export async function test_api_order_update_order_item_seller_success(
  connection: api.IConnection,
) {
  // 1. Seller user registration
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const businessRegistrationNumber = RandomGenerator.alphaNumeric(10);
  const sellerCreateBody = {
    email: sellerEmail,
    password: "Test1234!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: businessRegistrationNumber,
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Seller user login (role switch)
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "Test1234!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 3. Create sale product under seller
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: seller.id,
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 4. Member user registration
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberCreateBody = {
    email: memberEmail,
    password_hash: "Test1234!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 5. Member user login (role switch)
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: "Test1234!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 6. Member user places new order
  const orderCreateBody = {
    shopping_mall_memberuser_id: member.id,
    shopping_mall_channel_id: sale.shopping_mall_channel_id,
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
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

  // 7. Seller user login (role switch back)
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "Test1234!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 8. Seller adds order item to created order
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

  TestValidator.equals("initial order item quantity", orderItem.quantity, 1);
  TestValidator.equals("initial order item price", orderItem.price, 10000);
  TestValidator.equals(
    "initial order item status",
    orderItem.order_item_status,
    "pending",
  );

  // 9. Main Test: seller updates order item
  const updatedQuantity = 2;
  const updatedPrice = 9500;
  const updatedStatus = "shipped";

  const orderItemUpdateBody = {
    quantity: updatedQuantity,
    price: updatedPrice,
    order_item_status: updatedStatus,
  } satisfies IShoppingMallOrderItem.IUpdate;

  const updatedOrderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.sellerUser.orders.items.update(
      connection,
      {
        orderId: order.id,
        orderItemId: orderItem.id,
        body: orderItemUpdateBody,
      },
    );
  typia.assert(updatedOrderItem);

  TestValidator.equals(
    "updated order item quantity",
    updatedOrderItem.quantity,
    updatedQuantity,
  );
  TestValidator.equals(
    "updated order item price",
    updatedOrderItem.price,
    updatedPrice,
  );
  TestValidator.equals(
    "updated order item status",
    updatedOrderItem.order_item_status,
    updatedStatus,
  );
}
