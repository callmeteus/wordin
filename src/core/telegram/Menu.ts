import { Extra } from "telegraf";
import App, { AppBotContext } from "../../controller/App";
import MenuModel, { MenuOption } from "../../model/Menu";

/**
 * Represents a Telegram inline-keyboard option
 */
export class TelegramMenuOption extends MenuOption<TelegramMenu> {
    /**
     * Retrieves the text for a given button / action
     * @returns 
     */
    public getText(): string {
        if (typeof this.text === "symbol") {
            return this.menu.context.relatedChat.getLanguage().getMessage(
                (this.text as Symbol).description as string
            );
        }

        return this.text as string;
    }
}

export default class TelegramMenu extends MenuModel {
    public static build<T = TelegramMenu>(
        /**
         * The menu ID / namespace
         */
        id: string,

        /**
         * The menu title
         */
        title: string | Symbol,

         /**
          * All available options for this menu
          */
        options?: TelegramMenuOption[]
    ): (context: AppBotContext) => T {
        // @ts-ignore
        return (context: AppBotContext) => new this(id, title, options, context);
    }

    constructor(
        /**
         * The menu ID / namespace
         */
        protected id: string,

        /**
         * The menu title
         */
        protected title: string | Symbol,

        /**
         * All available options for this menu
         */
        protected options: TelegramMenuOption[],

        /**
         * The menu telegraf context
         */
        public context?: AppBotContext
    ) {
        super(id, title, options);
    }

    public getTitle(): string {
        if (typeof this.title === "symbol") {
            return this.context.relatedChat.getLanguage().getMessage(
                (this.title as Symbol).description
            );
        }

        return this.title as string;
    }

    private normalizeId(...id: string[]) {
        return id.join("/");
    }

    /**
     * Retrieves the inline keyboard markup for this menu
     * @returns 
     */
    public getMarkup() {
        return Extra.markup((m) => 
            m.inlineKeyboard(
                this.options.map((option) => 
                    option.forMenu<TelegramMenu, TelegramMenuOption>(this)
                )
                    .map((option) => 
                        m.callbackButton(option.getText(), this.normalizeId(this.id, option.id))
                    )
            )
        );
    }

    public listen() {
        const app = App.Instance();

        app.logger.info("menu \"%s\" is now listening for actions", this.id);

        // Iterate over all actions
        this.options.forEach((option) => {
            const optionId = this.normalizeId(this.id, option.id);

            if (optionId.length > 64) {
                app.logger.warn("action %s was not registered because its length is major than 64 bytes");
                return;
            }

            app.logger.debug("registered action %s", optionId);

            // When this action is executed
            app.bot.action(optionId, async (context) => {
                app.logger.debug("received callback action %s", optionId);

                await context.answerCbQuery();

                app.logger.debug("answered action %s", optionId);
            });
        });
    }

    public answer() {
        return this.context.replyWithHTML(
            this.getTitle(),
            this.getMarkup()
        );
    }
}