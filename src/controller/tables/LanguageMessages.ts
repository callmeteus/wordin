import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import LanguageTable from "./Language";

@Table({ tableName: "language_messages" })
export default class LanguageMessagesTable extends Model {
    /**
     * The message index
     */
    @Column({
        type: DataType.STRING(100),
        primaryKey: true
    })
    declare public index: string;

    /**
     * The message text
     */
    @Column(DataType.TEXT)
    declare public text: string;

    /**
     * The language ID
     */
    @ForeignKey(() => LanguageTable)
    @Column(DataType.STRING(5))
    declare public languageId: string;

    /**
     * The language of this message
     */
    @BelongsTo(() => LanguageTable)
    declare public language: LanguageTable;
};