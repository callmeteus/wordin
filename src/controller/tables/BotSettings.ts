import { Column, DataType, Index, Model, Table, Unique } from "sequelize-typescript";

/**
 * A table containing settings for the bot in general
 */
@Table({ tableName: "bot_settings", timestamps: false })
export default class BotSettingsTable extends Model {
    /**
     * The setting key
     */
    @Index("key")
    @Unique(true)
    @Column({
        type: DataType.STRING(50),
        primaryKey: true
    })
    declare public key: string;

    /**
     * The settings value
     */
    @Column(DataType.TEXT)
    declare public value: string;
};