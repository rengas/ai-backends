import initialise from './utils/initialise' 
import configureRoutes from './utils/apiRoutes'
import configureApiDocs from './utils/apiDocs'

const app = initialise()

// Configure the routes
configureRoutes(app)

// Configure the API docs
configureApiDocs(app)

export default app