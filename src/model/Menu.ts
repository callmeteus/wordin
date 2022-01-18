import { AppBotContext } from "../controller/App";

import { OptionTypes, OptionalLanguageText, SelectOptionType } from "./Menu.d";

export { SelectOptionType };

export class MenuOption<T extends MenuModel> {
    public static LANGUAGE_MESSAGE(message: string): Symbol {
        return Symbol.for(message);
    }

    constructor(
        /**
         * The option data
         */
        public option: OptionTypes<T>,

        protected menu?: T
    ) {

    }

    public get id() {
        return this.option.id;
    }

    public get type() {
        return this.option.type;
    }

    public get text() {
        return this.option.text;
    }

    public forMenu<M extends MenuModel, J extends MenuOption<T>>(menu: M): J {
        // @ts-ignore
        return new this.constructor(this.option, menu);
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