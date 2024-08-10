import { Controller, Get } from "@nestjs/common";

@Controller('/app')
export class AppController {
    @Get('/salut')
    getRootRoute() {
        return 'Salut toi !'
    }

    @Get('/bye')
    getByeThere() {
        return 'Au revoir !'
    }
}
