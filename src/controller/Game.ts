import App, { AppBotContext } from "./App";
import GameModel from "../model/Game";
import Chat from "./tables/Chat";
import { Middleware } from "telegraf";
import SettingsMenuController from "./bot/telegram/menus/SettingsMenu";

const games: Record<number, GameModel> = {};

export function hasGameFor(chat: number) {
    return games[chat] !== undefined;
}

/**
 * Retrieves the chat basic information for a given context
 * @param context The telegraf context
 * @param next Callback
 */
export function GetChatForContext(): Middleware<AppBotContext> {
    return async (context, next) => {
        await context.replyWithChatAction("typing");

        // Retrieve the chat related to this context
        context.relatedChat = await Chat.getOrCreateExternal(context.chat.id, "telegram");

        next();
    };
}

export default async function GameController(app: App) {
    // Call the settings menu controller
    await SettingsMenuController(app);

    // When the "start" command is issued
    app.bot.command("start", GetChatForContext(), async (context) => {
        // If chat already has a running game
        if (hasGameFor(context.relatedChat.id)) {
            return context.replyWithHTML(context.relatedChat.getLanguage().getMessage("game.error.already_running"));
        }

        games[context.relatedChat.id] = new GameModel(context, app, context.relatedChat);
        games[context.relatedChat.id].start();
    });

    // When the "help" command is issued
    app.bot.command("help", GetChatForContext(), (context) => {
        context.replyWithHTML(
            context.relatedChat.getLanguage().getMessage("help")
        );
    });

    // When any text message is received
    app.bot.on("text", GetChatForContext(), async (context) => {
        // If has no game for this chat
        if (!hasGameFor(context.relatedChat.id)) {
            return;
        }

        const game = games[context.relatedChat.id];

        // Check if it's not replying to the game message
        if (!context.message.reply_to_message || !game.isForMessage(context.message.reply_to_message)) {
            return;
        }

        // If it's all correct, process the message
        game.process(context);
    });
}