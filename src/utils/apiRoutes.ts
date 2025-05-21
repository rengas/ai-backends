import { OpenAPIHono } from "@hono/zod-openapi"
import summarizeRoute from "../routes/summarize"

function configureRoutes(app: OpenAPIHono) {

    // Add routes here
    app.route('/api', summarizeRoute)
    
}

export default configureRoutes