import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { sprintf } from "sprintf-js";

import rng from "seedrandom";
import App from "../controller/App";
import LanguageTable from "../controller/tables/Language";

export const LanguagesDir = path.resolve(__dirname, "../data/languages");

/**
 * Represents a word inside a dictionary
 */
export interface LanguageWord {
    /**
     * The parsed word
     */
    word: string,

    /**
     * The original unparsed world
     */
    originalWord?: string,

    /**
     * The word difficulty
     */
    difficulty: number
}

export default class Language {
    /**
     * The language code
     * Defaults to the filename
     */
    public code: string;

    /**
     * The language words
     */
    public words: LanguageWord[];

    /**
     * The language information / data
     */
    public data: {
        id: string,
        name: string,
        words: string,
        messages: Record<string, string | string[]>
    };

    constructor(code: string = null) {
        if (code !== null) {
            this.code = code;
        }

        if (this.code === null) {
            this.code = path.basename(__filename, "js");
        }
    }

    /**
     * Initializes the language
     * @returns 
     */
    public init(data?: LanguageTable) {
        return new Promise<LanguageTable>((resolve) => {
            if (data) {
                return resolve(data);
            }

            return LanguageTable.findOne({
                where: {
                    id: this.code
                }
            })
            .then(resolve);
        })
        .then((data) => {
            if (!data) {
                return this.initFromDisk();
            }

            this.data = data.toJSON();

            return this.data;
        });
    }

    public initFromDisk() {
        let languageFile = path.resolve(LanguagesDir, this.code + ".json");

        // If the language file doesn't exists
        if (!existsSync(languageFile)) {
            // Defaults to pt_BR for now
            // @todo make it default to en_US later
            languageFile = path.resolve(LanguagesDir, "pt_BR.json");
        }

        // Try loading the language file
        try {
            this.data = JSON.parse(
                readFileSync(
                    languageFile,
                    "utf-8"
                )
            );
        } catch(e) {
            App.Instance().logger.error("Failed to load language %s", this.code);
            throw e;
        }

        // Check if it's a JSON dictionary
        if (path.extname(languageFile) === ".json") {
            this.words = JSON.parse(readFileSync(path.resolve(LanguagesDir, this.data.words), "utf-8"));
        } else {
            // Load the language words file
            const words = readFileSync(
                path.resolve(LanguagesDir, this.data.words),
                "utf-8"
            )
                .split("\n")
                .map((word) => word.trim())
                .filter((word, index, arr) => {
                    // If the word length is invalid
                    if (word.length !== 5) {
                        App.Instance().logger.warn("word %s has a length different than 5", word);
                        return false;
                    }

                    // If the word is repeated
                    if (arr.indexOf(word) !== index) {
                        App.Instance().logger.warn("word %s is repeated", word);
                        return false;
                    }

                    return true;
                });

            this.words = words.map(w => {
                return {
                    word: w.replace(/ /g, "")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase(),
                    originalWord: w,
                    difficulty: 5
                };
            });

            // Save an updated JSON version to the disk
            writeFileSync(LanguagesDir + "/dictionary/pt_BR.json", JSON.stringify(this.words, null, "\t"));
        }

        return Promise.resolve(this.data);
    }

    /**
     * Checks if a word is present in the language dictionary
     * @param word The word to be checked
     * @returns 
     */
    public isWordPresent(word: string) {
        return this.words.some((w) => w.word === word);
    }

    /**
     * Retrieves a single message
     * @param index The message index to be retrieved
     * @returns 
     */
    public getMessage(index: string, ...args: (string | number)[]) {
        let message = this.data.messages[index];

        if (Array.isArray(message)) {
            message = message.join("\n");
        }

        return sprintf(message as string, ...args);
    }

    /**
     * Retrieves a random word from this language dictionary
     * @returns 
     */
    public getRandomWord(): LanguageWord {
        return this.words[Math.round(Math.random() * this.words.length)];
    }

    /**
     * Retrieves the daily word from this language dictionary
     * @returns
     */
    public getDailyWord(): LanguageWord {
        const prng = rng(new Date().toDateString());
        return this.words[Math.floor(prng() * (this.words.length - 1))];
    }
}