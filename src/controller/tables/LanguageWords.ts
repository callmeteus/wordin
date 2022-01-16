import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import LanguageTable from "./Language";

/**
 * Random comment: size 173 = pneumoultramicroscopicossilicovulcanoconiótico
 */
@Table({ tableName: "language_words" })
export default class LanguageWordsTable extends Model {
    /**
     * The parsed word without any accents (e.g.: cafes)
     */
    @Column({
        type: DataType.STRING(173)
    })
    declare public word: string;

    /**
     * The original word with accents (e.g.: cafés)
     */
    @Column({
        type: DataType.STRING(173)
    })
    declare public originalWorld: string;

    /**
     * The word difficulty
     */
    @Column({
        type: DataType.TINYINT
    })
    declare public difficulty: number;

    /**
     * The language ID
     */
    @ForeignKey(() => LanguageTable)
    @Column(DataType.STRING(5))
    declare public languageId: string;

    /**
     * The language of this word
     */
    @BelongsTo(() => LanguageTable)
    declare public language: LanguageTable;
};