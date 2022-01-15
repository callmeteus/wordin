import App from "./App";
import GameModel from "../model/Game";
import Language from "../model/Language";

const games: Record<number, GameModel> = {};

export function hasGameFor(chat: number) {
    return games[chat] !== undefined;
}

export default (app: App) => {
    const lang = new Language();

    // When the "start" command is sent
    app.bot.command("start", (context) => {
        // If chat already has a running game
        if (hasGameFor(context.chat.id)) {
            return context.replyWithHTML(lang.getMessage("game.error.already_running"));
        }

        games[context.chat.id] = new GameModel(context, app);
        games[context.chat.id].start();
    });

    // When the "help" command is sent
    app.bot.command("help", (context) => {
        context.replyWithHTML(
            lang.getMessage("help")
        );
    });

    // When any text message is received
    app.bot.on("text", (ctx) => {
        // If has no game for this chat
        if (!hasGameFor(ctx.chat.id)) {
            return;
        }

        const game = games[ctx.chat.id];

        // Check if it's not replying to the game message
        if (!ctx.message.reply_to_message || !game.isForMessage(ctx.message.reply_to_message)) {
            return;
        }

        // If it's all correct, process the message
        game.process(ctx);
    });
}