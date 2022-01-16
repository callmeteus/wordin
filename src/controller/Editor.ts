import App from "./App";

export default function EditorController(app: App) {
    // When the editor command is called
    app.bot.command("editor", (ctx) => {
        ctx.reply("Select one action to begin");
    });
}