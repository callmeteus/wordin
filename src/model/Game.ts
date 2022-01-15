import { Context } from "telegraf";
import { Message, ReplyMessage } from "telegraf/typings/telegram-types";
import App, { AppBotContext } from "../controller/App";
import Language from "./Language";

export enum GameModes {
    WORD_OF_THE_DAY,
    RANDOM_WORD
};

interface GameError {
    icon?: string,
    text: string,
    deleteMessage?: boolean
}

export default class GameModel {
    /**
     * The maximum number of tries to guess the word
     */
    public maxTries = 6;

    /**
     * The number of tries that the user already tried
     */
    public tries: string[] = [];

    /**
     * The game mode
     */
    public mode: GameModes = GameModes.WORD_OF_THE_DAY;

    /**
     * The language related to this game
     */
    public language: Language = new Language("pt_BR");

    /**
     * The game word
     */
    public word: string;

    /**
     * The game message that user will need to reply to
     */
    public message: Message;

    /**
     * All replies that were sent to the game message
     */
    public replies: Message[] = [];

    /**
     * If the game has ended
     */
    public ended = false;

    constructor(
        /**
         * The chat where the game is ocurring
         */
        private chat: Context,

        /**
         * The application instance related to this game
         */
        protected app: App
    ) {
        if (this.mode === GameModes.WORD_OF_THE_DAY) {
            this.word = this.language.getDailyWord();
        } else {
            this.word = this.language.getRandomWord();
        }

        this.app.logger.info("new game started, word is %s", this.word);
    }

    /**
     * Checks if the game is running for the given message
     * @param message The message to be checked agains
     * @returns 
     */
    public isForMessage(message: ReplyMessage) {
        return this.message && message.message_id === this.message.message_id;
    }

    /**
     * Starts a new game
     */
    public start() {
        this.chat.replyWithHTML(
            this.language.getMessage("game.start")
        );

        return this.sendProgress();
    }

    /**
     * Parses and prepares a word for checking
     * @param word The word to be prepared
     * @returns 
     */
    private parseWordForChecking(word: string) {
        return word.replace(/ /g, "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    /**
     * Processes the game with a given context message
     * @param ctx The sent message context to be processed
     * @returns 
     */
    public process(ctx: AppBotContext) {
        // Parse the word
        const word = this.parseWordForChecking(ctx.message.text);
        const parsedWord = this.parseWordForChecking(this.word);

        let error: GameError = null;

        // If the word length differs
        if (word.length !== parsedWord.length) {
            this.app.logger.debug("given length %d is different than word length %d", word.length, parsedWord.length);

            error = {
                deleteMessage: true,
                icon: "❌",
                text: this.language.getMessage("game.error.length_not_equal", parsedWord.length)
            };
        } else
        // Check if the given word belongs to the dictionary
        if (!this.language.isWordPresent(word)) {
            this.app.logger.debug("word %s is not present in the dictionary", word);

            error = {
                deleteMessage: true,
                icon: "❌",
                text: this.language.getMessage("game.error.word_not_present", word)
            };
        }

        // If any error happened
        if (error !== null) {
            // If needs to delete the message
            if (error.deleteMessage) {
                ctx.deleteMessage(ctx.message.message_id);
            } else {
                this.replies.push(ctx.message);
            }

            return this.sendProgress((error.icon ? error.icon + " " : "") + "<b>" + error.text + "</b>");
        }

        this.replies.push(ctx.message);

        // Check if the word are equals
        if (word === this.parseWordForChecking(parsedWord)) {
            return this.end(ctx);
        }

        // Check for letter matches
        let matches = [];

        for(let l = 0; l < word.length; l++) {
            // If the letter is at the right place
            if (parsedWord[l] === word[l]) {
                matches.push("🟩");
            } else
            // If the letter is at the wrong place
            if (parsedWord.includes(word[l])) {
                matches.push("🟨");
            } else {
                // If the letter doesn't exists
                matches.push("⬛");
            }
        }

        this.app.logger.debug("%s tried word %s", ctx.message.from.username, word);

        this.tries.push(matches.join(""));
        return this.sendProgress();
    }

    /**
     * Finishes the game
     * @param ctx The last answer context
     * @returns 
     */
    public end(ctx: Context) {
        this.ended = true;

        this.app.logger.debug("%s won the game", ctx.message.from.username);

        this.tries.push("🟩".repeat(this.word.length));

        return this.sendProgress(
            this.language.getMessage("game.win", ctx.message.from.username, this.word)
        )
            .then(() => {
                // Delete all replies
                return Promise.all(
                    this.replies.map((reply) =>
                        this.app.telegram.deleteMessage(reply.chat.id, reply.message_id)
                    )
                );
            });
    }

    /**
     * Prepares and prints the current game progress
     * @param header The header, optional
     * @param footer The footer, optional
     */
    public sendProgress(header: string = null, footer: string = null) {
        let msg: string[] = [];

        if (header) {
            msg.push(header + "\n");
        }

        // Calculate how many tries are remaining
        const remaniningTries = this.maxTries - this.tries.length;

        if (!this.ended) {
            msg.push(this.language.getMessage("game.answer_this_to_play"));
            msg.push(this.language.getMessage("game.tries", remaniningTries));
            msg.push("");
        }

        // Print out the other tries
        for(let currentTry of this.tries) {
            msg.push(currentTry);
        }

        // Print out the remaining tries
        for(let i = 0; i < remaniningTries; i++) {
            msg.push("⬜️".repeat(this.word.length));
        }

        if (footer) {
            msg.push("\n" + footer);
        }

        if (this.message) {
            return this.app.telegram.editMessageText(
                this.chat.chat.id,
                this.message.message_id,
                null,
                msg.join("\n"),
                {
                    parse_mode: "HTML"
                }
            )
            .then(() => {
                return this.message;
            })
        } else {
            return this.chat.replyWithHTML(msg.join("\n"))
            .then((msg) => {
                this.message = msg;

                return msg;
            });
        }
    }
}