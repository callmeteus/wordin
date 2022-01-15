import { createServer } from "http";
import { Context, Telegraf, Telegram } from "telegraf";
import { MessageEntity } from "telegraf/typings/telegram-types";
import { createLogger, format, transports } from "winston";

import Bot from "./Bot";

export interface AppBotContext extends Context {
    getMessage(): string,
    getArguments(): string[]
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

    private port = process.env.PORT || 3000;

    public telegram: Telegram = new Telegram(process.env.BOT_TOKEN);

    public bot: typeof Telegraf & {
        context: AppBotContext,
        on: (event: string, callback: (context: AppBotContext) => any) => any
    } = new Telegraf(process.env.BOT_TOKEN) as any;

    public logger = createLogger({
        level: process.env.NODE_ENV !== "production" ? "debug" : "info",
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

    init() {
        return this.createHttpServer()
        .then(() => {
            this.logger.info("listening at %s", "http://localhost:" + this.port);

            return this.createTelegramBot();
        })
        .then(() => {
            Bot(this);
        });
    }
    
    createHttpServer() {
        return new Promise<void>((resolve) => {
            // Start a fake HTTP server
            createServer((req, res) => {
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });

                res.write(`<html><body>WordleBot is Running</body></html>`);

                res.end();
            }).listen(this.port, resolve);
        });
    }

    createTelegramBot() {
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
                allowedUpdates: ["message"]
            }
        });

        return Promise.resolve();
    }
}