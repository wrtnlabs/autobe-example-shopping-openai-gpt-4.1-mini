import { IPage } from "./IPage";
import { IShoppingMallSellerUser } from "./IShoppingMallSellerUser";

export namespace IPageIShoppingMallSellerUser {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallSellerUser.ISummary[];
  };
}
