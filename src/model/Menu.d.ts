import type MenuModel from "./Menu";

type DefaultOptionTypes = "submenu" | "back" | "firstpage";

type OptionalLanguageText = string | Symbol;

/**
 * Represents an option type
 */
interface OptionType<TMenu extends MenuModel> {
    /**
     * The option ID
     */
    id: string,

    /**
     * The option type
     */
    type: "toggle" | "text" | "number" | "select" | DefaultOptionTypes,

    /**
     * The option mesage text
     */
    text: OptionalLanguageText
}

interface OptionTypeWithGetter<TMenu extends MenuModel, TGetterType> extends OptionType<TMenu> {
    get: (menu: TMenu) => TGetterType
}

interface OptionTypeWithGetterAndSetter<TMenu extends MenuModel, TValueType> extends OptionTypeWithGetter<TMenu, TValueType> {
    set: (value: TValueType, menu: TMenu) => Promise<any>
}

/**
 * Represents the toggle option type
 */
interface ToggleOptionType<TMenu extends MenuModel> extends OptionTypeWithGetterAndSetter<TMenu, boolean> {
    type: "toggle"
}

/**
 * Represents the text input option type
 */
interface TextOptionType<TMenu extends MenuModel> extends OptionTypeWithGetterAndSetter<TMenu, string> {
    type: "text"
}

/**
 * Represents the number input option type
 */
interface NumberOptionType<TMenu extends MenuModel> extends OptionTypeWithGetterAndSetter<TMenu, number> {
    type: "number"
}

/**
 * Represents the selection option type
 */
interface SelectOptionType<TMenu extends MenuModel, TType> extends OptionTypeWithGetterAndSetter<TMenu, TType> {
    type: "select",
    options: {
        text: string,
        value: string
    }[]
}

type OptionTypes<TMenu extends MenuModel> = ToggleOptionType<TMenu> | TextOptionType<TMenu> | NumberOptionType<TMenu> | SelectOptionType<TMenu, any>;