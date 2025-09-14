import { IPage } from "./IPage";
import { IShoppingMallGuestUsers } from "./IShoppingMallGuestUsers";

export namespace IPageIShoppingMallGuestUsers {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallGuestUsers.ISummary[];
  };
}
