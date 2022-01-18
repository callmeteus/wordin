import { Extra } from "telegraf";
import App, { AppBotContext } from "../../controller/App";
import { GetChatForContext } from "../../controller/Game";
import MenuModel from "../../model/Menu";
import TelegramMenuOption from "./menu/TelegramMenuOption";

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
        public id: string,

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

    /**
     * Normalizes an action ID
     * @param id Any IDs to be concatenated and normalized
     * @returns 
     */
    public normalizeId(...id: string[]) {
        return this.id + "/" + id.join("/");
    }

    /**
     * Retrieves the inline keyboard markup for this menu
     * @returns 
     */
    public getMarkup() {
        return Extra.HTML(true).markup((m) => 
            m.inlineKeyboard(
                this.options.map((option) => 
                    option.forMenu<TelegramMenu, TelegramMenuOption>(this)
                )
                    .map((option) => 
                        m.callbackButton(option.getText(), this.normalizeId(option.id))
                    )
            )
        );
    }

    public listen() {
        const app = App.Instance();

        app.logger.info("menu \"%s\" is now listening for actions", this.id);

        // Add an action to the main menu itself
        app.bot.action(this.normalizeId(), GetChatForContext(), async(context) => {
            await context.answerCbQuery();

            this.answer(true);
        });

        // Iterate over all options
        this.options.forEach((option) => {
            // Normalize the option ID
            const optionId = this.normalizeId(option.id);

            // If the length is major than 64 (max. allowed by Telegram)
            if (optionId.length > 64) {
                app.logger.warn("action %s was not registered because its length is major than 64 bytes");
                return;
            }

            app.logger.debug("registered action %s", optionId);

            // When this option is called
            app.bot.action(optionId, GetChatForContext(), async (context) => {
                app.logger.debug("received callback action %s", optionId);

                app.logger.debug("answered action %s", optionId);

                this.context = context;
                option.update(this, context);

                await context.answerCbQuery();
            });

            // If it's a select
            if (option.type === "select") {
                // Create the RegExp for this action
                const actionRegExp = new RegExp(optionId.replace(/[-[\]{}()*+?.,\\^$|#\s]/, "\\$&") + "/(.+)");

                // Register an action for the select options too
                app.bot.action(actionRegExp, GetChatForContext(), async (context) => {
                    const value = context.callbackQuery.data.match(actionRegExp);

                    app.logger.debug("received select option callback for select \"%s\", value is \"%s\"", optionId, value[1]);

                    this.context = context;
                    option.update(this, context, value[1]);

                    await context.answerCbQuery();
                });
            }
        });
    }

    public answer(edit = false) {
        return (!edit ? this.context.reply : this.context.editMessageText)(
            this.getTitle(),
            this.getMarkup()
        );
    }
}