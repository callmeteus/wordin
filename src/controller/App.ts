import { createServer } from "http";
import { Context, Middleware, Telegraf, Telegram } from "telegraf";
import { MessageEntity } from "telegraf/typings/telegram-types";
import { createLogger, format, transports } from "winston";

import GameController from "./Game";
import EditorController from "./Editor";
import Database from "./Database";
import BotSettingsTable from "./tables/BotSettings";
import Chat from "./tables/Chat";

export interface AppBotContext extends Context {
    getMessage(): string,
    getArguments(): string[],
    relatedChat: Chat
}

export default class App {
    private static INSTANCE: App;

    /**
     * Creates or retrieves an application instance
     * @returns 
     */
    public static Instance() {
        if (this.INSTANCE === null) {
            this.INSTANCE = new App();
        }

        return this.INSTANCE;
    }

    /**
     * The port where the agent will run
     */
    private port = process.env.PORT || 3000;

    /**
     * If the application is in debug mode
     */
    public debug: boolean = process.env.NODE_ENV !== "production";

    public telegram: Telegram = new Telegram(process.env.BOT_TOKEN);

    public bot: Telegraf<AppBotContext> & {
        context: AppBotContext,
        //on: (event: string, ...middlewares: ReadonlyArray<Middleware<AppBotContext>>) => any
    } = new Telegraf(process.env.BOT_TOKEN) as any;

    /**
     * The application database instance
     */
    public db = new Database(this);

    /**
     * The application settings
     */
    public settings: {
        /**
         * A list of accounts that moderate the bot
         */
        modAccounts?: string[]
    } = {};

    public logger = createLogger({
        level: this.debug ? "debug" : "info",
        format: format.combine(
            // Applies colors to the messages
            format.colorize(),

            // Splat is a sprintf() utility
            format.splat(),

            // Use labels
            format.label({ label: "app" }),

            // Use timestamp
            format.timestamp({
                format: "DD/MM HH:mm:ss"
            }),

            // Use printf with our custom format
            format.printf(({ level, message, label, timestamp }) => {
                return `${timestamp} [${label}] ${level}: ${message}`;
            })
        ),
        transports: [
            new transports.Console()
        ]
    });

    constructor() {
        App.INSTANCE = this;
        this.init();
    }

    /**
     * Initializes the application
     * @returns 
     */
    private init() {
        this.logger.info("connecting to the database...");

        return this.db.init()
        .then(() => {
            this.logger.info("connected to the database");
            this.logger.info("updating application settings...");

            return this.updateApplicationSettings();
        })
        .then(() => {
            this.logger.info("application settings was updated");
            this.logger.info("starting up the HTTP server...");

            return this.createHttpServer();
        })
        .then(() => {
            this.logger.info("agent listening at %s", "http://localhost:" + this.port);

            return this.createTelegramBot();
        })
        .then(() => {
            GameController(this);
            EditorController(this);
        });
    }
    
    /**
     * Creates the application HTTP server
     * @returns 
     */
    private createHttpServer() {
        return new Promise<void>((resolve) => {
            // Start a fake HTTP server
            createServer((req, res) => {
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });

                res.write(`<html><body>WordIn server is Running</body></html>`);

                res.end();
            }).listen(this.port, resolve);
        });
    }

    /**
     * Creates the application Telegraft instance
     * @returns 
     */
    private createTelegramBot() {
        /**
         * Retrieves the context text message
         * 
         * @returns {String}
         */
        this.bot.context.getMessage = function() {
            return this.update.message.text;
        };

        /**
         * Retrieves the command arguments
         * 
         * @returns {Array[String]}
         */
        this.bot.context.getArguments = function() {
            // Get the message
            let text = this.getMessage();

            // Iterate over all entities
            this.update.message.entities.forEach((entity: MessageEntity) => {
                // Check if it's a bot command
                if (entity.type === "bot_command") {
                    // Remove it from the string
                    text = text.substr(0, entity.offset) + text.substr(entity.length);
                }
            });

            return text.trim().split(" ").filter((txt: string) => txt.length > 0);
        };

        // Launch the bot
        // @ts-ignore
        this.bot.launch({
            polling: {
                allowedUpdates: ["message", "callback_query"]
            }
        });

        // Enable graceful stop
        process.once("SIGINT", () => this.bot.stop());
        process.once("SIGTERM", () => this.bot.stop());

        return Promise.resolve();
    }

    /**
     * Updates the bot settings
     * @returns
     */
    private updateApplicationSettings() {
        return BotSettingsTable.findAll()
        .then((options) => {
            options.forEach((option) => {
                let value = option.value;

                try {
                    value = JSON.parse(value);
                } catch(e) {

                }

                // @ts-ignore
                this.settings[option.key] = value;
            });

            this.logger.debug("application settings were updated: %O", this.settings);

            return true;
        });
    }
}