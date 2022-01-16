import TelegramMenu from "../../../../core/telegram/Menu";
import TelegramMenuOption from "../../../../core/telegram/menu/MenuOption";
import App from "../../../App";
import { GetChatForContext } from "../../../Game";

const SettingsMenu = TelegramMenu.build(
    "settings",
    TelegramMenuOption.LANGUAGE_MESSAGE("settings"),
    [
        new TelegramMenuOption({
            id: "notify_daily_word",
            type: "toggle",
            text: TelegramMenuOption.LANGUAGE_MESSAGE("settings.button.notify_daily_word"),
            get: (menu) => menu.context.relatedChat.get("notifyDailyWord"),
            set: (value, menu) => menu.context.relatedChat.update({ notifyDailyWord: value })
        }),

        new TelegramMenuOption({
            id: "language",
            type: "select",
            text: TelegramMenuOption.LANGUAGE_MESSAGE("settings.button.language"),
            options: [],
            get: (menu) => menu.context.relatedChat.get("languageId"),
            set: (value, menu) => menu.context.relatedChat.update({ languageId: value })
        })
    ]
);

export default function SettingsMenuController(app: App) {
    // Start listening
    SettingsMenu(null).listen();

    // When the "settings" command is issued
    app.bot.command("settings", GetChatForContext(true), (ctx) => SettingsMenu(ctx).answer());
}