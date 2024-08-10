import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

// sert comme startup.cs
@Module({
    controllers: [AppController]
})
export class AppModule {}