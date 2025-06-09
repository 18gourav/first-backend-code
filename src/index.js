import connectDB from "./db/db.js";
import dotenv from "dotenv";
import {app} from "./app.js";

connectDB()
.then(() => {
      app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT || 5000}`);
    
      })
})
.catch((error) => {
    console.log('database is not connected!!', error);

})

dotenv.config({
    path: './.env'
})