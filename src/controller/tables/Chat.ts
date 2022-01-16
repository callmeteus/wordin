import { BelongsTo, Column, DataType, Default, ForeignKey, HasOne, Model, Table } from "sequelize-typescript";
import Language from "../../model/Language";
import LanguageTable from "./Language";

type ChatSources = "telegram" | "discord";

/**
 * A table containing data for given chats / users
 */
@Table({ tableName: "chat", timestamps: false })
export default class Chat extends Model {
    /**
     * The external chat ID
     */
    @Column({
        type: DataType.STRING(64)
    })
    declare public externalId: string;

    /**
     * The chat source
     */
    @Column({
        type: DataType.ENUM("telegram", "discord")
    })
    declare public source: ChatSources;

    /**
     * The chat language ID
     */
    @ForeignKey(() => LanguageTable)
    @Column(DataType.STRING(5))
    declare public languageId: string;
 
    /**
     * The chat language
     */
    @BelongsTo(() => LanguageTable)
    declare public language: LanguageTable;

    /**
     * If we can notify the daily word for this chat
     */
    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    declare public notifyDailyWord: boolean;

    /**
     * Retrieves an external chat instance
     * @param externalId The external chat ID
     * @param source The chat source
     * @returns 
     */
    public static getOrCreateExternal(externalId: string | number, source: ChatSources) {
        return Chat.findOne({
            where: {
                externalId: externalId,
                source: source
            },
            include: [{ all: true }]
        })
        .then((data) => {
            // If no chat has been found
            if (!data) {
                // Create a new one
                return Chat.create({
                    externalId: externalId,
                    source: source,
                    notifyDailyWord: false
                })
                .then((chat) => {
                    return chat;
                });
            }

            return data;
        });
    }

    /**
     * The language instance for this table
     */
    private languageInstance: Language = null;

    public async initializeLanguage() {
        if (this.languageInstance === null) {
            this.languageInstance = new Language(this.languageId);
            await this.languageInstance.init();
        }

        return this.languageInstance;
    }

    public getLanguage() {
        return this.languageInstance;
    }
};