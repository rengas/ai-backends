import initialise from './utils/initialise' 
import configureRoutes from './utils/apiRoutes'
import configureApiDocs from './utils/apiDocs'
import displayLogo from './utils/logo'

// Display ASCII logo on startup
displayLogo()

const app = initialise()

// Configure the routes and API docs
async function setup() {
    await configureRoutes(app)
    await configureApiDocs(app)
}

setup().catch(console.error)

export default app