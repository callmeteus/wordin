import { Sequelize } from "sequelize-typescript";
import App from "./App";

export default class Database {
    /**
     * The database sequelize instance
     */
    public sequelize: Sequelize;

    constructor(
        protected app: App
    ) {
        // Create the sequelize instance
        this.sequelize = new Sequelize(process.env.DATABASE_URL, {
            models: [__dirname + "/tables"]
        });
    }

    public init() {
        return this.app.debug ? this.sequelize.sync({ alter: true }) : this.sequelize.authenticate();
    }
}