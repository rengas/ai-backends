import initialise from './utils/initialise' 
import configureRoutes from './utils/apiRoutes'
import configureApiDocs from './utils/apiDocs'

const app = initialise()

// Configure the routes and API docs
async function setup() {
    await configureRoutes(app)
    configureApiDocs(app)
}

setup().catch(console.error)

export default app