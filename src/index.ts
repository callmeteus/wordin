import App from "./controller/App";

// Load the dotenv
process.env.NODE_ENV !== "production" && require("dotenv").config();

new App();