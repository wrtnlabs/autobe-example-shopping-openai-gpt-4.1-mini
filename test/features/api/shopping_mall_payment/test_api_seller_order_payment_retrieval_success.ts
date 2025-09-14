import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This comprehensive E2E test validates the end-to-end payment retrieval
 * functionality for a seller user in a shopping mall context. It covers user
 * registration, authentication, sales product creation, order placement,
 * payment application, and payment retrieval. The test includes multiple user
 * roles (seller and member) with proper role switching and robust type
 * assertions.
 */
export async function test_api_seller_order_payment_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins (registration)
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "P@ssword123";
  const sellerCreateBody = {
    email: sellerEmail,
    password: sellerPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);
  TestValidator.equals("seller email matches", sellerUser.email, sellerEmail);

  // 2. Seller user login for authentication context
  const sellerLoginBody = {
    email: sellerEmail,
    password: sellerPassword,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerUserLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(sellerUserLogin);
  TestValidator.equals(
    "seller login email matches",
    sellerUserLogin.email,
    sellerEmail,
  );

  // 3. Seller user creates a sales product
  const saleCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUserLogin.id,
    code: RandomGenerator.alphaNumeric(6).toUpperCase(),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    price: typia.random<
      number & tags.Type<"uint32"> & tags.Minimum<1000> & tags.Maximum<100000>
    >(),
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);
  TestValidator.equals(
    "sale seller user ID matches",
    sale.shopping_mall_seller_user_id,
    sellerUserLogin.id,
  );

  // 4. Member user joins (registration)
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "P@ssword123";
  const memberCreateBody = {
    email: memberEmail,
    password_hash: memberPassword,
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
  TestValidator.equals("member email matches", memberUser.email, memberEmail);

  // 5. Member user login for authentication context
  const memberLoginBody = {
    email: memberEmail,
    password: memberPassword,
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberUserLogin: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLoginBody,
    });
  typia.assert(memberUserLogin);
  TestValidator.equals(
    "member login email matches",
    memberUserLogin.email,
    memberEmail,
  );

  // 6. Member user places an order
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUserLogin.id,
    shopping_mall_channel_id: saleCreateBody.shopping_mall_channel_id,
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(8).toUpperCase(),
    order_status: "pending",
    payment_status: "pending",
    total_price: saleCreateBody.price,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderCreateBody },
    );
  typia.assert(order);
  TestValidator.equals(
    "order member user ID matches",
    order.shopping_mall_memberuser_id,
    memberUserLogin.id,
  );
  TestValidator.equals(
    "order total price matches sale price",
    order.total_price,
    saleCreateBody.price,
  );

  // 7. Member user creates a payment application for the order
  const paymentCreateBody = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: order.total_price,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;

  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.memberUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreateBody,
      },
    );
  typia.assert(payment);
  TestValidator.equals(
    "payment order ID matches order.id",
    payment.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "payment amount equals order total",
    payment.payment_amount,
    order.total_price,
  );

  // 8. Switch back to seller user login (simulate role switch)
  await api.functional.auth.sellerUser.login(connection, {
    body: sellerLoginBody,
  });

  // 9. Seller user retrieves the payment application details
  const retrievedPayment: IShoppingMallPayment =
    await api.functional.shoppingMall.sellerUser.orders.payments.at(
      connection,
      {
        orderId: order.id,
        paymentId: payment.id,
      },
    );
  typia.assert(retrievedPayment);
  TestValidator.equals(
    "retrieved payment id matches payment.id",
    retrievedPayment.id,
    payment.id,
  );
  TestValidator.equals(
    "retrieved payment order id matches order.id",
    retrievedPayment.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "retrieved payment amount matches original",
    retrievedPayment.payment_amount,
    payment.payment_amount,
  );
}
