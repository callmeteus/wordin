import TelegramMenu from "../../../../core/telegram/TelegramMenu";
import TelegramMenuOption from "../../../../core/telegram/menu/TelegramMenuOption";
import App from "../../../App";
import { GetChatForContext } from "../../../Game";

export default async function SettingsMenuController(app: App) {
    const SettingsMenu = TelegramMenu.build(
        "settings",
        TelegramMenuOption.LANGUAGE_MESSAGE("settings"),
        [
            // Daily word option
            new TelegramMenuOption({
                id: "notify_daily_word",
                type: "toggle",
                text: TelegramMenuOption.LANGUAGE_MESSAGE("settings.button.notify_daily_word"),
                get: (menu) => menu.context.relatedChat.get("notifyDailyWord"),
                set: (value, menu) => menu.context.relatedChat.update({ notifyDailyWord: value })
            }),
    
            // Language option
            new TelegramMenuOption({
                id: "language",
                type: "select",
                text: TelegramMenuOption.LANGUAGE_MESSAGE("settings.button.language"),
                options: Object.values(app.languages)
                    .map((l) => {
                        return {
                            text: l.data.name,
                            value: l.code
                        }
                    })
                ,
                get: (menu) => menu.context.relatedChat.get("languageId"),
                set: (value, menu) => menu.context.relatedChat.update({ languageId: value })
            })
        ]
    );

    // Start listening
    SettingsMenu(null).listen();

    // When the "settings" command is issued
    app.bot.command("settings", GetChatForContext(), (ctx) => SettingsMenu(ctx).answer());
}