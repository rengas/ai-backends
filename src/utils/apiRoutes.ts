import { OpenAPIHono } from "@hono/zod-openapi"
import summarizeRoute from "../routes/summarize"
import keywordsRoute from "../routes/keywords"

function configureRoutes(app: OpenAPIHono) {

    // Add routes here
    app.route('/api', summarizeRoute)
    app.route('/api', keywordsRoute)
    
}

export default configureRoutes