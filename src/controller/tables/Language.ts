import { Column, DataType, Model, Table } from "sequelize-typescript";
import Language from "../../model/Language";

@Table({ tableName: "language" })
export default class LanguageTable extends Model {
    /**
     * The language ISO ID (e.g.: en_US)
     */
    @Column({
        type: DataType.STRING(5),
        primaryKey: true
    })
    declare public id: string;

    /**
     * The language name (e.g.: English)
     */
    @Column({
        type: DataType.STRING(50),
        primaryKey: true
    })
    declare public name: string;
};