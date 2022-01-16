import App, { AppBotContext } from "../../../controller/App";
import MenuModel, { MenuOption } from "../../../model/Menu";
import type TelegramMenu from "../Menu";

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

    public async update(menu: TelegramMenu, context: AppBotContext) {
        let newValue;

        switch(this.type) {
            case "toggle":
                newValue = !this.option.get(menu);

                // @ts-ignore
                await this.option.set(newValue, menu);
            break;
        }

        App.Instance().logger.info("update option \"%s\" for chat \"%s\", new value is \"%s\"", this.id, context.relatedChat.id, newValue);

        context.editMessageText(menu.getTitle(), menu.getMarkup());
    }
}