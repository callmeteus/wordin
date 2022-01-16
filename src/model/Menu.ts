import { AppBotContext } from "../controller/App";

import { OptionTypes, OptionalLanguageText } from "./Menu.d";

export class MenuOption<T extends MenuModel> {
    public static LANGUAGE_MESSAGE(message: string): Symbol {
        return Symbol.for(message);
    }

    public type: string;
    public text: OptionalLanguageText;
    public id: string;

    constructor(
        /**
         * The option data
         */
        option: OptionTypes<T>,

        protected menu?: T
    ) {
        this.id = option.id;
        this.type = option.type;
        this.text = option.text;
    }

    public forMenu<M extends MenuModel, J extends MenuOption<T>>(menu: M): J {
        // @ts-ignore
        return new this.constructor({
            id: this.id,
            type: this.type,
            text: this.text
        }, menu);
    }
}

export default abstract class MenuModel {
    public static build<T extends MenuModel>(
        /**
         * The menu ID / namespace
         */
        id: string,

        /**
         * The menu title
         */
        title: OptionalLanguageText,

         /**
          * All available options for this menu
          */
        options?: (MenuOption<any> | MenuModel)[]
    ): (context: AppBotContext) => T {
        // @ts-ignore
        return (context: AppBotContext) => new this(title, options, context);
    }

    constructor(
        /**
         * The menu ID / namespace
         */
        protected id: string,

        /**
         * The menu title
         */
        protected title: OptionalLanguageText,

        /**
         * All available options for this menu
         */
        protected options?: (MenuOption<any> | MenuModel)[]
    ) {

    }

    /**
     * Retrieves the menu title
     * @returns 
     */
    public getTitle() {
        return this.title;
    }
}