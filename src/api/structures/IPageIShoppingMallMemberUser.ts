import { IPage } from "./IPage";
import { IShoppingMallMemberUser } from "./IShoppingMallMemberUser";

export namespace IPageIShoppingMallMemberUser {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallMemberUser.ISummary[];
  };
}
