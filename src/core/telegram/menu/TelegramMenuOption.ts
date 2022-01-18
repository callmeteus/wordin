import { Extra } from "telegraf";
import App, { AppBotContext } from "../../../controller/App";
import MenuModel, { MenuOption } from "../../../model/Menu";
import { SelectOptionType } from "../../../model/Menu";
import type TelegramMenu from "../TelegramMenu";

/**
 * Represents a Telegram inline-keyboard option
 */
export default class TelegramMenuOption extends MenuOption<TelegramMenu> {
    /**
     * Retrieves the text for a given button / action
     * @returns 
     */
    public getText(): string {
        let text = this.text;

        if (typeof this.text === "symbol") {
            text = this.menu.context.relatedChat.getLanguage().getMessage(
                (this.text as Symbol).description as string
            );
        }

        switch(this.type) {
            case "toggle":
                text = (this.option.get(this.menu) ? "✅" : "❌") + " " + text;
            break;
        }

        return text as string;
    }

    public async update(menu: TelegramMenu, context: AppBotContext, additionalData?: any) {
        let newValue;

        switch(this.type) {
            // If it's a toggler
            case "toggle":
                newValue = !this.option.get(menu);

                // @ts-ignore
                await this.option.set(newValue, menu);
            break;

            // If it's a select
            case "select":
                // If no option has been selected
                if (!additionalData) {
                    // Send the options to the client
                    return context.editMessageText(
                        // The title contains the menu title with an additional "choose option" text
                        menu.getTitle() + "\n\n" + context.relatedChat.getLanguage().getMessage("settings.select.choose_option"),
                        Extra.HTML(true).markup((m) => {
                            const currentOption = this.option.get(menu);

                            const buttons = [
                                // Display all the options
                                ...(this.option as SelectOptionType<TelegramMenu, string>).options.map((option) => 
                                    m.callbackButton(
                                        (currentOption === option.value ? "✅ " : "") + option.text,
                                        menu.normalizeId(this.id, option.value)
                                    )
                                ),
                                // and a button to go back to the previous menu
                                m.callbackButton("🔙", menu.normalizeId())
                            ];

                            return m.inlineKeyboard(buttons);
                        })
                    )
                } else {
                    // @ts-ignore
                    await this.option.set(additionalData, menu);
                }
            break;
        }

        context.editMessageText(menu.getTitle(), menu.getMarkup());
    }
}